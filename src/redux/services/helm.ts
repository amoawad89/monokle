import {EventEmitter} from 'events';
import fs from 'fs';
import log from 'loglevel';
import micromatch from 'micromatch';
import path from 'path';
import {v4 as uuidv4} from 'uuid';
import {parse} from 'yaml';

import {HELM_CHART_ENTRY_FILE} from '@constants/constants';

import {AppConfig} from '@models/appconfig';
import {FileMapType, HelmChartMapType, HelmValuesMapType, ResourceMapType} from '@models/appstate';
import {FileEntry} from '@models/fileentry';
import {HelmChart, HelmValuesFile} from '@models/helm';
import {K8sResource} from '@models/k8sresource';

import {createFileEntry, extractK8sResourcesFromFile, fileIsExcluded, readFiles} from '@redux/services/fileEntry';

import {getFileStats} from '@utils/files';

export const HelmChartEventEmitter = new EventEmitter();

/**
 * Gets the HelmValuesFile for a specific FileEntry
 */

export function getHelmValuesFile(fileEntry: FileEntry, helmValuesMap: HelmValuesMapType) {
  return Object.values(helmValuesMap).find(valuesFile => valuesFile.filePath === fileEntry.filePath);
}

/**
 * Gets the HelmChart for a specific FileEntry
 */

export function getHelmChartFromFileEntry(fileEntry: FileEntry, helmChartMap: HelmChartMapType) {
  return Object.values(helmChartMap).find(chart => chart.filePath === fileEntry.filePath);
}

/**
 * Checks if the specified path is a helm values file
 */

export function isHelmValuesFile(filePath: string) {
  return micromatch.isMatch(path.basename(filePath), '*values*.yaml');
}

/**
 * Checks if the specified files are a Helm Chart folder
 */

export function isHelmChartFolder(files: string[]) {
  return files.indexOf(HELM_CHART_ENTRY_FILE) !== -1;
}

/**
 * check if the k8sResource is supported
 * @param resource
 * @returns @boolean
 */
export function isSupportedHelmResource(resource: K8sResource): boolean {
  const helmVariableRegex = /{{.*}}/g;

  return Boolean(resource.text.match(helmVariableRegex)?.length) === false;
}

/**
 * Processes the specified folder as containing a Helm Chart
 */

export function processHelmChartFolder(
  folder: string,
  rootFolder: string,
  files: string[],
  appConfig: AppConfig,
  resourceMap: ResourceMapType,
  fileMap: FileMapType,
  helmChartMap: HelmChartMapType,
  helmValuesMap: HelmValuesMapType,
  result: string[],
  depth: number
) {
  let helmChart: HelmChart | undefined;

  try {
    const helmChartFilePath = path.join(folder, HELM_CHART_ENTRY_FILE);
    const fileText = fs.readFileSync(helmChartFilePath, 'utf8');
    const fileContent = parse(fileText);

    if (typeof fileContent?.name !== 'string') {
      throw new Error(`Couldn't get the name property of the helm chart at path: ${helmChartFilePath}`);
    }

    helmChart = {
      id: uuidv4(),
      filePath: helmChartFilePath.substr(rootFolder.length),
      name: fileContent.name,
      valueFileIds: [],
    };
    HelmChartEventEmitter.emit('create', helmChart);
  } catch (e) {
    if (e instanceof Error) {
      log.warn(`[processHelmChartFolder]: ${e.message}`);
    }
  }

  files.forEach(file => {
    const filePath = path.join(folder, file);
    const fileEntryPath = filePath.substr(rootFolder.length);
    const fileEntry = createFileEntry(fileEntryPath);

    if (fileIsExcluded(appConfig, fileEntry)) {
      fileEntry.isExcluded = true;
    } else if (getFileStats(filePath)?.isDirectory()) {
      const folderReadsMaxDepth = appConfig.projectConfig?.folderReadsMaxDepth || appConfig.folderReadsMaxDepth;

      if (depth === folderReadsMaxDepth) {
        log.warn(`[readFiles]: Ignored ${filePath} because max depth was reached.`);
      } else {
        fileEntry.children = readFiles(
          filePath,
          appConfig,
          resourceMap,
          fileMap,
          helmChartMap,
          helmValuesMap,
          depth + 1,
          isSupportedHelmResource
        );
      }
    } else if (isHelmValuesFile(file) && helmChart) {
      const helmValues: HelmValuesFile = {
        id: uuidv4(),
        filePath: fileEntryPath,
        name: file,
        isSelected: false,
        helmChartId: helmChart.id,
      };

      helmValuesMap[helmValues.id] = helmValues;
      helmChart.valueFileIds.push(helmValues.id);
      fileEntry.isSupported = true;
    } else if (appConfig.fileIncludes.some(e => micromatch.isMatch(fileEntry.name, e))) {
      try {
        extractK8sResourcesFromFile(filePath, fileMap).forEach(resource => {
          resourceMap[resource.id] = resource;
        });
      } catch (e) {
        log.warn(`Failed to parse yaml in file ${fileEntry.name}; ${e}`);
      }

      fileEntry.isSupported = true;
    }

    fileMap[fileEntry.filePath] = fileEntry;
    result.push(fileEntry.name);
  });

  if (helmChart) {
    helmChartMap[helmChart.id] = helmChart;
  }
}
