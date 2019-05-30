import { App } from './app';
import { ConfigSocketIo } from '../../common/src/config/configSocketIo';

const app = new App();
app.configureProvidedDist();
app.listen(ConfigSocketIo.PORT);
