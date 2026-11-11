import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
// WebGL without a GPU (cloud containers / CI): ANGLE -> SwiftShader. Override with --gl=angle on a GPU machine.
Config.setChromiumOpenGlRenderer('swangle');
Config.setConcurrency(2);
