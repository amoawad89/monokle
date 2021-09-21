import {useAppDispatch, useAppSelector} from '@redux/hooks';
import {setMonacoEditor} from '@redux/reducers/ui';
import {useCallback, useEffect} from 'react';
import {monaco} from 'react-monaco-editor';

function useEditorUiState(editor: monaco.editor.IStandaloneCodeEditor | null, selectedResourceId: string | undefined) {
  const dispatch = useAppDispatch();
  const monacoEditor = useAppSelector(state => state.ui.monacoEditor);

  const onEditorFocus = () => {
    dispatch(setMonacoEditor({focused: true}));
  };

  const handleClickOutside = useCallback(() => {
    if (editor && editor.hasTextFocus()) {
      dispatch(setMonacoEditor({focused: true}));
    } else {
      dispatch(setMonacoEditor({focused: false}));
    }
  }, [selectedResourceId]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!monacoEditor.focused) {
      return;
    }

    if (editor && monacoEditor.undo) {
      editor.trigger(null, 'undo', null);
      dispatch(setMonacoEditor({undo: false}));
    }
    if (editor && monacoEditor.redo) {
      editor.trigger(null, 'redo', null);
      dispatch(setMonacoEditor({redo: false}));
    }
    if (editor && monacoEditor.find) {
      editor.trigger(null, 'actions.find', null);
      dispatch(setMonacoEditor({find: false}));
    }
    if (editor && monacoEditor.replace) {
      editor.trigger(null, 'editor.action.startFindReplaceAction', null);
      dispatch(setMonacoEditor({replace: false}));
    }
  }, [monacoEditor]);

  return {onEditorFocus};
}

export default useEditorUiState;
