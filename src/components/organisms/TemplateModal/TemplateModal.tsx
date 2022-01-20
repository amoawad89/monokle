import React, {LegacyRef, useCallback, useMemo, useState} from 'react';
import {ResizableBox} from 'react-resizable';
import {useMeasure} from 'react-use';

import {Button, Skeleton, Steps} from 'antd';

import {Primitive} from 'type-fest';

import {AnyTemplate, isReferencedHelmChartTemplate, isVanillaTemplate} from '@models/template';

import {useAppDispatch, useAppSelector} from '@redux/hooks';
import {kubeConfigContextSelector, kubeConfigPathSelector} from '@redux/selectors';
import {previewReferencedHelmChart} from '@redux/services/previewReferencedHelmChart';
import {createUnsavedResourcesFromVanillaTemplate} from '@redux/services/templates';

import {TemplateFormRenderer} from '@components/molecules';

import * as S from './styled';

type TemplateModalProps = {template: AnyTemplate; onClose: () => void};

type FormDataList = Record<string, Primitive>[];

const TemplateModal: React.FC<TemplateModalProps> = props => {
  const {template, onClose} = props;

  const dispatch = useAppDispatch();
  const kubeConfigPath = useAppSelector(kubeConfigPathSelector);
  const kubeConfigContext = useAppSelector(kubeConfigContextSelector);
  const userTempDir = useAppSelector(state => state.config.userTempDir);

  const [activeFormIndex, setActiveFormIndex] = useState<number>(0);
  const [currentFormDataList, setCurrentFormDataList] = useState<FormDataList>(template.forms.map(() => ({})));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<string>();

  const [containerRef, {height: containerHeight}] = useMeasure<HTMLDivElement>();

  const activeForm = useMemo(() => {
    return activeFormIndex < template.forms.length ? template.forms[activeFormIndex] : undefined;
  }, [template.forms, activeFormIndex]);

  const onClickSubmit = useCallback(
    (formDataList: Record<string, Primitive>[]) => {
      if (isVanillaTemplate(template)) {
        setIsLoading(true);
        createUnsavedResourcesFromVanillaTemplate(template, formDataList, dispatch)
          .then((msg: string) => {
            setResultMessage(msg);
            setIsLoading(false);
          })
          .catch((err: Error) => {
            setResultMessage(err.message);
            setIsLoading(false);
          });
        return;
      }

      if (!isReferencedHelmChartTemplate(template) || !userTempDir || !kubeConfigPath || !kubeConfigContext) {
        return;
      }
      setIsLoading(true);
      previewReferencedHelmChart(
        template.chartName,
        template.chartVersion,
        template.chartRepo,
        template.valuesFilePath,
        formDataList,
        kubeConfigPath,
        kubeConfigContext,
        userTempDir,
        dispatch
      )
        .then((notes: string) => {
          setResultMessage(notes);
          setIsLoading(false);
        })
        .catch((err: Error) => {
          setResultMessage(err.message);
          setIsLoading(false);
        });
    },
    [template, userTempDir, kubeConfigPath, kubeConfigContext, dispatch]
  );

  const setFormData = useCallback(
    (formIndex: number, formData: Record<string, Primitive>) => {
      const newFormDataList = currentFormDataList.slice(0);
      newFormDataList.splice(formIndex, 1, formData);
      setCurrentFormDataList(newFormDataList);
      setActiveFormIndex(formIndex + 1);
      if (formIndex + 1 === template.forms.length) {
        onClickSubmit(newFormDataList);
      }
    },
    [currentFormDataList, onClickSubmit, template.forms.length]
  );

  const onFormSubmit = (formIndex: number, formData: any) => {
    setFormData(formIndex, formData);
  };

  const close = () => {
    setIsLoading(false);
    setResultMessage(undefined);
    setCurrentFormDataList([]);
    onClose();
  };

  if (!activeForm && !resultMessage && !isLoading) {
    return <p>Something went wrong...</p>;
  }

  return (
    <S.Modal
      visible
      footer={
        resultMessage ? (
          <Button type="primary" onClick={close} loading={isLoading}>
            Done
          </Button>
        ) : null
      }
      onCancel={close}
      width="min-content"
    >
      <ResizableBox
        height={containerHeight}
        width={800}
        minConstraints={[600, containerHeight]}
        maxConstraints={[window.innerWidth - 64, containerHeight]}
        axis="x"
        resizeHandles={['w', 'e']}
        handle={(h: number, ref: LegacyRef<HTMLSpanElement>) => (
          <span className={`custom-modal-handle custom-modal-handle-${h}`} ref={ref} />
        )}
      >
        <S.Container ref={containerRef}>
          <div>
            <Steps direction="vertical" current={activeFormIndex}>
              {template.forms.map(form => {
                return <S.Step key={form.name} title={form.name} />;
              })}
              <S.Step title="Result" />
            </Steps>
          </div>

          <div style={{paddingRight: '10px'}}>
            {isLoading ? (
              <Skeleton />
            ) : resultMessage ? (
              <S.StyledTextArea rows={16} value={resultMessage} readOnly />
            ) : activeForm ? (
              <TemplateFormRenderer
                key={activeFormIndex}
                isLastForm={activeFormIndex === template.forms.length - 1}
                onSubmit={formData => onFormSubmit(activeFormIndex, formData)}
                templateForm={activeForm}
              />
            ) : null}
          </div>
        </S.Container>
      </ResizableBox>
    </S.Modal>
  );
};

export default TemplateModal;
