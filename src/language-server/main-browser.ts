/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import { EmptyFileSystem, DocumentState } from 'langium';
import { BrowserMessageReader, BrowserMessageWriter, Diagnostic, NotificationType, createConnection } from 'vscode-languageserver/browser.js';
import { createVideoMlServices } from './video-ml-module.js';
import { VideoProject } from './generated/ast.js';
import { generateTimelineElementInfos } from '../generator/ui/ui-generator.js';
import { generatePythonProgram } from '../generator/generator.js';
import { TimelineElementInfo } from '../generator/ui/types.js';
import { startLanguageServer } from 'langium/lsp';

declare const self: DedicatedWorkerGlobalScope;

/* browser specific setup code */
const messageReader = new BrowserMessageReader(self);
const messageWriter = new BrowserMessageWriter(self);

const connection = createConnection(messageReader, messageWriter);

// Inject the shared services and language-specific services
const { shared, VideoMl } = createVideoMlServices({connection, ...EmptyFileSystem });

// Start the language server with the shared services
startLanguageServer(shared);

// Send a notification with the serialized AST after every document change
type DocumentChange = { uri: string, content: string, diagnostics: Diagnostic[] };
const documentChangeNotification = new NotificationType<DocumentChange>('browser/DocumentChange');
const jsonSerializer = VideoMl.serializer.JsonSerializer;
shared.workspace.DocumentBuilder.onBuildPhase(DocumentState.Validated, documents => {
    for (const document of documents) {
        const videoProject = document.parseResult.value as VideoProject;
        let timelineJson: TimelineElementInfo[] = [];
        let pythonCode: string = "";

        if(document.diagnostics === undefined  || document.diagnostics.filter((i) => i.severity === 1).length === 0) {
            timelineJson = generateTimelineElementInfos(videoProject);
            pythonCode = generatePythonProgram(videoProject);
            (videoProject as unknown as {$isValid: boolean}).$isValid = true;
        } else {
            (videoProject as unknown as {$isValid: boolean}).$isValid = false;
        }
        
        (videoProject as unknown as {$timelineElementInfos: TimelineElementInfo[]}).$timelineElementInfos = timelineJson;
        (videoProject as unknown as {$pythonCode: string}).$pythonCode = pythonCode;
        connection.sendNotification(documentChangeNotification, {
            uri: document.uri.toString(),
            content: jsonSerializer.serialize(videoProject, { sourceText: true, textRegions: true }),
            diagnostics: document.diagnostics ?? []
        });
    }
});
