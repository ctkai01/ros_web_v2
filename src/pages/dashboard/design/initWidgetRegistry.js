import widgetRegistry from './WidgetRegistry';
// import MapDialog from './MapWidget/MapDialog';
// import MissionActionLogDialog from './MissionActionLogWidget/MissionActionLogDialog';
// import MapLockerDialog from './MapWidget/MapLockerDialog';
// import MissionButtonDialog from './MissionButtonWidget/MissionButtonDialog';
import { MissionButtonGroupDialog } from "../../../components/widgets/MissionButtonGroupWidget";
import { MapDialog } from '../../../components/widgets/MapWidget';
// import JoystickDialog from './JoystickWidget/JoystickDialog';
import {PauseContinueDialog} from "../../../components/widgets/PauseContinueWidget";
import { MissionQueueDialog } from '../../../components/widgets/MissionQueueWidget';
// import MissionQueueDialog from './MissionQueueWidget/MissionQueueDialog';

// Initialize widget registry với các dialogs
const initializeWidgetRegistry = () => {

  // Register dialogs for each widget type
  widgetRegistry.registerDialog("map", MapDialog);
  // widgetRegistry.registerDialog('map-locked', MapLockerDialog);
  // widgetRegistry.registerDialog('mission-action-log', MissionActionLogDialog);
  // widgetRegistry.registerDialog('mission-button', MissionButtonDialog);
  widgetRegistry.registerDialog('mission-button-group', MissionButtonGroupDialog);
  // widgetRegistry.registerDialog('joystick', JoystickDialog);
  widgetRegistry.registerDialog('pause-continue', PauseContinueDialog);
  widgetRegistry.registerDialog('mission-queue', MissionQueueDialog);
  // Add more widget dialogs here as needed
  
};

// Auto-initialize when imported
initializeWidgetRegistry();

export default widgetRegistry; 