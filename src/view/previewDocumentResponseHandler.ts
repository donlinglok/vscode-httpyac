import { HttpRegion, utils } from 'httpyac';
import * as vscode from 'vscode';
import { getConfigSetting } from '../config';
import { ResponseHandlerResult } from '../extensionApi';
import { writeTempFileName, showTextEditor, getContent, getResponseViewContext } from './responseHandlerUtils';


export async function previewDocumentResponseHandler(httpRegion: HttpRegion) :Promise<boolean | ResponseHandlerResult> {
  const config = getConfigSetting();

  const editorConfig = vscode.workspace.getConfiguration('workbench.editor');

  let extension: string | undefined;
  if (editorConfig.enablePreview
    && config.responseViewMode === 'preview'
    && httpRegion.response?.rawBody) {
    const responseViewContent = getResponseViewContext(config.responseViewContent, !!httpRegion.response?.body);

    let content = httpRegion.response.rawBody;

    if (utils.isString(httpRegion.response.body)) {
      if (config.responseViewContent && config.responseViewContent !== 'body') {
        content = Buffer.from(getContent(httpRegion.response, config.responseViewContent));
        extension = 'http';
      } else if (httpRegion.response.prettyPrintBody
        && config.responseViewPrettyPrint) {
        content = Buffer.from(httpRegion.response.prettyPrintBody);
      }
    }
    if (content.length === 0) {
      content = Buffer.from(getContent(httpRegion.response, responseViewContent));
      extension = 'http';
    }

    const fileName = await writeTempFileName(content, httpRegion, extension);
    if (fileName) {

      const document = await vscode.workspace.openTextDocument(vscode.Uri.file(fileName));
      const editor = await showTextEditor(document, true);
      return {
        document,
        editor,
        deleteFile: true
      };
    }
  }
  return false;
}
