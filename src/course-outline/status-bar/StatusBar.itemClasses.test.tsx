import { VIDEO_SHARING_OPTIONS } from '@src/course-outline/constants';
import { CourseOutlineStatusBar } from '@src/course-outline/data/types';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import { MemoryRouter } from 'react-router-dom';
import { StatusBar, StatusBarProps } from './StatusBar';
import messages from './messages';

const courseId = 'course-v1:123';
const isLoading = false;

const statusBarData: CourseOutlineStatusBar = {
  courseReleaseDate: 'Feb 05, 2013 at 05:00 UTC',
  isSelfPaced: true,
  endDate: '2013-04-09T00:00:00Z',
  checklist: {
    totalCourseLaunchChecks: 5,
    completedCourseLaunchChecks: 1,
    totalCourseBestPracticesChecks: 4,
    completedCourseBestPracticesChecks: 1,
  },
  highlightsEnabledForMessaging: false,
  videoSharingEnabled: false,
  videoSharingOptions: VIDEO_SHARING_OPTIONS.allOn,
};

jest.mock('@src/course-libraries/data/apiHooks', () => ({
  useEntityLinksSummaryByDownstreamContext: () => ({
    data: [{ readyToSyncCount: 2 }],
    isLoading: false,
  }),
}));

let mockHasChanges = false;
jest.mock('@src/course-outline/data/apiHooks', () => ({
  useCourseDetails: () => ({
    data: { hasChanges: mockHasChanges },
    isLoading: false,
  }),
}));
const mockOpenEnableHighlightsModal = jest.fn();
const mockHandleVideoSharingOptionChange = jest.fn();

const renderComponent = (props?: Partial<StatusBarProps>) =>
  render(
    <MemoryRouter><IntlProvider locale="en" messages={{}}><StatusBar
      courseId={courseId}
      isLoading={isLoading}
      statusBarData={statusBarData}
      openEnableHighlightsModal={mockOpenEnableHighlightsModal}
      handleVideoSharingOptionChange={mockHandleVideoSharingOptionChange}
      {...props}
    /></IntlProvider></MemoryRouter>,
  );


jest.mock('@src/help-urls/hooks', () => ({
  useHelpUrls: () => ({ socialSharing: 'https://example.invalid/help' }),
}));
jest.mock('./hooks', () => ({
  useDynamicHookShim: () => () => ({ notificationAppData: { tabsCount: { count: 3 } } }),
}));
describe('native item classes', () => {
  const itemClassNames = {
    courseBadge: 'consumer-status-badge',
    courseDates: 'consumer-status-dates',
    checklists: 'consumer-status-checklists',
    highlights: 'consumer-status-highlights',
  };
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2013-03-05'));
    mockHasChanges = true;
    mockOpenEnableHighlightsModal.mockClear();
    mockHandleVideoSharingOptionChange.mockClear();
  });
  afterEach(() => {
    jest.useRealTimers();
    mockHasChanges = false;
  });
  it.each([
    ['2013-03-05', 'Active'],
    ['2012-03-05', 'Upcoming'],
    ['2014-03-05', 'Archived'],
  ])('marks only requested native items at %s', (now, badge) => {
    jest.setSystemTime(new Date(now));
    const props = { itemClassNames, statusBarData: { ...statusBarData, videoSharingEnabled: true } };
    // Structural typing lets the same runtime regression run on the old API.
    renderComponent(props);
    expect(screen.getByText(badge)).toHaveClass(itemClassNames.courseBadge, 'px-3', 'py-2');
    expect(screen.getByText('Feb 05, 2013 - Apr 09, 2013').closest('a')).toHaveClass(itemClassNames.courseDates);
    expect(screen.getByText(`2/9 ${messages.checklistCompleted.defaultMessage}`)).toHaveClass(itemClassNames.checklists);
    expect(screen.getByTestId('highlights-enable-button')).toHaveClass(itemClassNames.highlights);
    expect(document.querySelectorAll('[class*="consumer-status-"]')).toHaveLength(4);
    for (const text of ['Unpublished Changes', '2 Library Updates', 'Video Sharing:']) {
      expect(screen.getByText(text).closest('[class*="consumer-status-"]')).toBeNull();
    }
    const notifications = document.querySelector('small.d-flex');
    expect(notifications).toBeInTheDocument();
    if (!notifications) { throw new Error('Expected native notifications'); }
    expect(notifications.closest('[class*="consumer-status-"]')).toBeNull();
    expect(screen.getByText('2 Library Updates').closest('a')).toHaveAttribute('href', `/course/${courseId}/libraries?tab=review`);
    fireEvent.click(screen.getByTestId('highlights-enable-button'));
    expect(mockOpenEnableHighlightsModal).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: VIDEO_SHARING_OPTIONS.allOff } });
    expect(mockHandleVideoSharingOptionChange).toHaveBeenCalledWith(VIDEO_SHARING_OPTIONS.allOff);
  });
  it('marks set-date and enabled-highlight roots without creating an absent badge', () => {
    const props = { itemClassNames, statusBarData: { ...statusBarData, courseReleaseDate: 'Set Date', highlightsEnabledForMessaging: true } };
    renderComponent(props);
    expect(screen.getByText('Set Date').closest('a')).toHaveClass(itemClassNames.courseDates);
    expect(screen.getByTestId('highlights-enabled-span')).toHaveClass(itemClassNames.highlights);
    expect(document.querySelectorAll('.consumer-status-badge')).toHaveLength(0);
    expect(document.querySelectorAll('[class*="consumer-status-"]')).toHaveLength(3);
  });
  it('keeps native class names when the optional API is omitted', () => {
    renderComponent();
    expect(screen.getByText('Active')).toHaveClass('px-3', 'py-2');
    expect(screen.getByText('Feb 05, 2013 - Apr 09, 2013').closest('a')).toHaveClass('small', 'text-gray-700');
    expect(document.querySelectorAll('[class*="consumer-status-"]')).toHaveLength(0);
  });
  it('preserves the loading empty state', () => {
    const props = { itemClassNames, isLoading: true };
    const { container } = renderComponent(props);
    expect(container).toBeEmptyDOMElement();
  });
});
