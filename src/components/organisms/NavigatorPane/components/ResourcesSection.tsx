import React, {useState} from 'react';
import micromatch from 'micromatch';

import {useSelector} from 'react-redux';

import {useAppDispatch, useAppSelector} from '@redux/hooks';
import {MonoSectionTitle, MonoSectionHeaderCol} from '@components/atoms';
import {K8sResource} from '@models/k8sresource';
import {NavigatorSubSection} from '@models/navigator';
import {selectActiveResources} from '@redux/selectors';
import {selectK8sResource} from '@redux/reducers/main';

import NavigatorContentTitle from './NavigatorContentTitle';

import SectionRow from './SectionRow';
import SectionCol from './SectionCol';
import Section from './Section';

import {ALL_NAMESPACES} from '../constants';

type ResourcesSectionType = {
  namespace: string;
};

const ResourcesSection = (props: ResourcesSectionType) => {
  const dispatch = useAppDispatch();
  const {namespace} = props;
  const selectedResource = useAppSelector(state => state.main.selectedResource);
  const appConfig = useAppSelector(state => state.config);

  const resources = useSelector(selectActiveResources);

  const selectResource = (resourceId: string) => {
    dispatch(selectK8sResource(resourceId));
  };

  const [expandedSubsectionsBySection, setExpandedSubsectionsBySection] = useState<Record<string, string[]>>(
    // set all subsections of each section as expanded by default
    Object.fromEntries(
      appConfig.navigators
        .map(navigator => navigator.sections)
        .flat()
        .map(section => [section.name, section.subsections.map(subsection => subsection.name)])
    )
  );

  const handleSubsectionExpand = (sectionName: string, subsectionName: string) => {
    setExpandedSubsectionsBySection({
      ...expandedSubsectionsBySection,
      [sectionName]: [...(expandedSubsectionsBySection[sectionName] || []), subsectionName],
    });
  };

  const handleSubsectionCollapse = (sectionName: string, subsectionName: string) => {
    setExpandedSubsectionsBySection({
      ...expandedSubsectionsBySection,
      [sectionName]: expandedSubsectionsBySection[sectionName].filter(s => s !== subsectionName),
    });
  };

  function shouldSectionBeVisible(item: K8sResource, subsection: NavigatorSubSection) {
    return (
      (!appConfig.settings.filterObjectsOnSelection || item.highlight || item.selected || !selectedResource) &&
      item.kind === subsection.kindSelector &&
      micromatch.isMatch(item.version, subsection.apiVersionSelector) &&
      (namespace === ALL_NAMESPACES || item.namespace === namespace || (namespace === 'default' && !item.namespace))
    );
  }

  return (
    <SectionRow>
      <SectionCol>
        {appConfig.navigators.map(navigator => {
          return (
            <div key={navigator.name}>
              <SectionRow>
                <MonoSectionHeaderCol>
                  <MonoSectionTitle>{navigator.name}</MonoSectionTitle>
                </MonoSectionHeaderCol>
              </SectionRow>
              <SectionRow>
                <SectionCol>
                  {navigator.sections.map(section => {
                    return (
                      <div key={section.name}>
                        {section.name.length > 0 && (
                          <SectionRow>
                            <NavigatorContentTitle>{section.name}</NavigatorContentTitle>
                          </SectionRow>
                        )}
                        <Section
                          expandedSubsections={expandedSubsectionsBySection[section.name]}
                          onSubsectionExpand={handleSubsectionExpand}
                          onSubsectionCollapse={handleSubsectionCollapse}
                          section={section}
                          shouldBeVisible={shouldSectionBeVisible}
                          resources={resources}
                          selectResource={selectResource}
                        />
                      </div>
                    );
                  })}
                </SectionCol>
              </SectionRow>
            </div>
          );
        })}
      </SectionCol>
    </SectionRow>
  );
};

export default ResourcesSection;
