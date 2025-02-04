import {app} from 'electron';
import unhandled from 'electron-unhandled';

import log from 'loglevel';
import {machineIdSync} from 'node-machine-id';
import Nucleus from 'nucleus-nodejs';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';

import {fixPath} from '@utils/path';

import terminal from '@root/cli/terminal';

import './ipc/ipcListeners';
import {openApplication} from './openApplication';
import {initNucleus, saveInitialK8sSchema, setDeviceID, setProjectsRootFolder} from './utils';

const isDev = process.env.NODE_ENV === 'development';

const userHomeDir = app.getPath('home');
const userDataDir = app.getPath('userData');

// This has to run before everything else related to Nucleus.
Nucleus.appStarted();

let {disableErrorReports, disableTracking} = initNucleus(isDev, app);
unhandled({
  logger: error => {
    if (!disableErrorReports) {
      Nucleus.trackError((error && error.name) || 'Unnamed error', error);
    }
  },
  showDialog: false,
});

setProjectsRootFolder(userHomeDir);
saveInitialK8sSchema(userDataDir);
setDeviceID(machineIdSync(), disableTracking);
fixPath();

if (process.env.MONOKLE_RUN_AS_NODE) {
  yargs(hideBin(process.argv)).command(
    '$0',
    'opens current directory',
    () => {},
    async argv => {
      const {executedFrom} = argv;
      openApplication(executedFrom as string);
    }
  ).argv;
} else {
  openApplication();
}

terminal().catch(e => log.error(e));
