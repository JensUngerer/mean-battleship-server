import { App } from './app';
const app = new App();
app.configureProvidedDist('./client/dist/client');
app.listen(3030);
