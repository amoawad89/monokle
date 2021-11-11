import path from 'path';

import {setAlert} from '@redux/reducers/alert';
import {setKubeconfigPathValidity, updateKubeconfig} from '@redux/reducers/appConfig';
import {onUserPerformedClickOnClusterIcon} from '@redux/reducers/uiCoach';

import {AlertEnum} from '@models/alert';

import electronStore from '@utils/electronStore';
import {PROCESS_ENV} from '@utils/env';

function initKubeconfig(store: any, userHomeDir: string) {
  if (PROCESS_ENV.KUBECONFIG) {
    const envKubeconfigParts = PROCESS_ENV.KUBECONFIG.split(path.delimiter);
    if (envKubeconfigParts.length > 1) {
      store.dispatch(updateKubeconfig(envKubeconfigParts[0]));
      store.dispatch(
        setAlert({
          title: 'KUBECONFIG warning',
          message: 'Found multiple configs, selected the first one.',
          type: AlertEnum.Warning,
        })
      );
    } else {
      store.dispatch(updateKubeconfig(PROCESS_ENV.KUBECONFIG));
    }
    return;
  }
  const storedKubeconfig: string | undefined = electronStore.get('appConfig.kubeconfig');
  const storedIsKubeconfigPathValid: boolean = electronStore.get('appConfig.isKubeconfigPathValid');
  if (storedKubeconfig && storedKubeconfig.trim().length > 0) {
    store.dispatch(updateKubeconfig(storedKubeconfig));
    store.dispatch(setKubeconfigPathValidity(storedIsKubeconfigPathValid));
    store.dispatch(onUserPerformedClickOnClusterIcon());
    return;
  }
  store.dispatch(updateKubeconfig(path.join(userHomeDir, `${path.sep}.kube${path.sep}config`)));
}

export default initKubeconfig;
