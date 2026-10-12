import { Fragment as StudioDefaultFragment } from 'react';
import { PluginSlot } from '@openedx/frontend-plugin-framework';
import classNames from 'classnames';
import { Card } from '@openedx/paragon';

const SidebarSection = ({ className = null, children = null, ...props }: SidebarSectionProps) => (
<PluginSlot id="org.mereka.authoring.unit_sidebar_card.v1" pluginProps={{}}>
{[<StudioDefaultFragment key="default_contents">
  <Card
    className={classNames('course-unit-sidebar', className)}
    {...props}
  >
    {children}
  </Card>
</StudioDefaultFragment>]}
</PluginSlot>
);

interface SidebarSectionProps {
  className?: string | null;
  children?: React.ReactNode | null;
}

export default SidebarSection;
