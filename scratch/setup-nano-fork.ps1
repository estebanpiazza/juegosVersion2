param(
  [string]$ForkPath = (Join-Path (Split-Path -Parent $PSScriptRoot) "scratch-editor"),
  [string]$RepoUrl = "https://github.com/scratchfoundation/scratch-editor.git"
)

$ErrorActionPreference = "Stop"

$nanoSource = Join-Path $PSScriptRoot "nano-scratch.png"
if (-not (Test-Path -LiteralPath $nanoSource)) {
  throw "No se encontro $nanoSource."
}

if (-not (Test-Path -LiteralPath $ForkPath)) {
  git clone --depth=1 $RepoUrl $ForkPath
}

$defaultProjectDir = Join-Path $ForkPath "packages\scratch-gui\src\lib\default-project"
if (-not (Test-Path -LiteralPath $defaultProjectDir)) {
  throw "No se encontro packages/scratch-gui/src/lib/default-project dentro de $ForkPath."
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$nanoHash = (Get-FileHash -Algorithm MD5 -LiteralPath $nanoSource).Hash.ToLowerInvariant()
$nanoFileName = "$nanoHash.png"
Copy-Item -LiteralPath $nanoSource -Destination (Join-Path $defaultProjectDir $nanoFileName) -Force

$indexTs = @"
import projectData from './project-data';
import {TranslatorFunction} from '../../gui-config';

import backdrop from '!raw-loader!./cd21514d0531fdffb22204e0ec5ed84a.svg?';
import nanoPng from '!arraybuffer-loader!./$nanoFileName?';

declare function require (path: 'fastestsmallesttextencoderdecoder'): {TextEncoder: typeof TextEncoder};

const defaultProject = (translator?: TranslatorFunction) => {
    let _TextEncoder: typeof TextEncoder;
    if (typeof TextEncoder === 'undefined') {
        _TextEncoder = require('fastestsmallesttextencoderdecoder').TextEncoder;
    } else {
        _TextEncoder = TextEncoder;
    }
    const encoder = new _TextEncoder();

    const projectJson = projectData(translator);
    return [{
        id: 0,
        assetType: 'Project',
        dataFormat: 'JSON',
        data: JSON.stringify(projectJson)
    }, {
        id: 'cd21514d0531fdffb22204e0ec5ed84a',
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(backdrop)
    }, {
        id: '$nanoHash',
        assetType: 'ImageBitmap',
        dataFormat: 'PNG',
        data: new Uint8Array(nanoPng)
    }];
};

export default defaultProject;
"@

$projectDataTs = @"
import projectDataMessages from './messages';
import sharedMessages from '../shared-messages';
import {MessageObject, TranslatorFunction} from '../../gui-config';

const messages = {...projectDataMessages, ...sharedMessages};
const defaultTranslator = (msgObj: MessageObject) => msgObj.defaultMessage;
const nanoAssetId = '$nanoHash';

const projectData = (translateFunction?: TranslatorFunction): object => {
    const translator = translateFunction || defaultTranslator;
    return ({
        targets: [
            {
                isStage: true,
                name: 'Stage',
                variables: {},
                lists: {},
                broadcasts: {},
                blocks: {},
                currentCostume: 0,
                costumes: [
                    {
                        assetId: 'cd21514d0531fdffb22204e0ec5ed84a',
                        name: translator(messages.backdrop, {index: 1}),
                        md5ext: 'cd21514d0531fdffb22204e0ec5ed84a.svg',
                        dataFormat: 'svg',
                        rotationCenterX: 240,
                        rotationCenterY: 180
                    }
                ],
                sounds: [],
                volume: 100,
                layerOrder: 0,
                tempo: 60,
                videoTransparency: 50,
                videoState: 'on',
                textToSpeechLanguage: null
            },
            {
                isStage: false,
                name: 'Nano',
                variables: {},
                lists: {},
                broadcasts: {},
                blocks: {},
                currentCostume: 0,
                costumes: [
                    {
                        assetId: nanoAssetId,
                        name: 'Nano',
                        bitmapResolution: 1,
                        md5ext: '$nanoFileName',
                        dataFormat: 'png',
                        rotationCenterX: 120,
                        rotationCenterY: 179
                    }
                ],
                sounds: [],
                volume: 100,
                visible: true,
                x: 0,
                y: -15,
                size: 70,
                direction: 90,
                draggable: false,
                rotationStyle: 'all around',
                layerOrder: 1
            }
        ],
        monitors: [],
        extensions: [],
        meta: {
            semver: '3.0.0',
            vm: '0.2.0',
            agent: 'BeTech Nano starter'
        }
    });
};

export default projectData;
"@

[System.IO.File]::WriteAllText((Join-Path $defaultProjectDir "index.ts"), $indexTs, $utf8NoBom)
[System.IO.File]::WriteAllText((Join-Path $defaultProjectDir "project-data.ts"), $projectDataTs, $utf8NoBom)

Write-Host "Scratch fork preparado en $ForkPath"
Write-Host "Nano asset: packages/scratch-gui/src/lib/default-project/$nanoFileName"
Write-Host "Siguiente paso: cd $ForkPath; npm install; npm start"
