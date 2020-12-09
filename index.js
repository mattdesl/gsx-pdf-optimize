#!/usr/bin/env node
const execa = require("execa");
const minimist = require("minimist");
const path = require("path");
const fs = require("fs");
const dateformat = require("dateformat");
const { promisify } = require("util");
const mkdirp = promisify(require("mkdirp"));

module.exports = optimize;
module.exports.build = build;
module.exports.spawn = spawn;

function spawn(opt = {}) {
  const [command, args] = build(opt);
  return execa(command, args);
}

async function optimize(opt = {}) {
  const { quiet = true, stdout = false, stdin = false } = opt;

  let input = opt.input || "";
  let output = opt.output || "";
  if (!stdin && !input) throw new Error(`No input specified`);

  if (input) input = path.resolve(input);

  if (!output && !stdout) {
    if (input) {
      const ext = path.extname(input);
      const name = path.basename(input, ext);
      const dir = path.dirname(input);
      const newFile = `${name}-optimized-${getTimeStamp()}${ext}`;
      output = path.resolve(dir, newFile);
    } else {
      output = `optimized-${getTimeStamp()}.pdf`;
    }
  }

  if (output) output = path.resolve(output);

  if (input && input === output) {
    throw new Error(`Input and output should be different`);
  }

  if (!stdin && input && !fs.existsSync(input)) {
    throw new Error("Input file does not exist");
  }

  if (output && !stdout) {
    const dir = path.dirname(output);
    await mkdirp(dir);
  }

  const [command, args] = build({
    ...opt,
    input,
    output,
    stdout,
    quiet,
  });

  if (!quiet) {
    console.log(`${command} ${args.join(" ")}`);
  }

  return execa(command, args, {
    stdio: "inherit",
  });
}

function build(opt = {}) {
  const command = process.env.GSX_OPTIMIZE_COMMAND || opt.command || "gsx";

  const {
    input = "-",
    output = "-",
    compatibilityLevel = 1.5,
    compressFonts = true,
    embedAllFonts = true,
    subsetFonts = true,
    dpi = 300,
    quiet = true,
    preset = "screen",
    colorConversionStrategy = "RGB",
  } = opt;

  const stdin = input === "-" || Boolean(opt.stdin);
  const stdout = output === "-" || Boolean(opt.stdout);

  const outputFile = stdout ? "-" : JSON.stringify(output);

  const args = [
    "-sDEVICE=pdfwrite",
    `-dPDFSETTINGS=/${preset}`,
    "-dNOPAUSE",
    quiet ? "-dQUIET" : "",
    "-dBATCH",
    `-dCompatibilityLevel=${String(compatibilityLevel)}`,
    // font settings
    `-dSubsetFonts=${subsetFonts}`,
    `-dCompressFonts=${compressFonts}`,
    `-dEmbedAllFonts=${embedAllFonts}`,
    // color format
    "-sProcessColorModel=DeviceRGB",
    `-sColorConversionStrategy=${colorConversionStrategy}`,
    `-sColorConversionStrategyForImages=${colorConversionStrategy}`,
    "-dConvertCMYKImagesToRGB=true",
    // image resampling
    "-dDetectDuplicateImages=true",
    "-dColorImageDownsampleType=/Bicubic",
    `-dColorImageResolution=${dpi}`,
    "-dGrayImageDownsampleType=/Bicubic",
    `-dGrayImageResolution=${dpi}`,
    "-dMonoImageDownsampleType=/Bicubic",
    `-dMonoImageResolution=${dpi}`,
    "-dDownsampleColorImages=true",
    // other overrides
    "-dDoThumbnails=false",
    "-dCreateJobTicket=false",
    "-dPreserveEPSInfo=false",
    "-dPreserveOPIComments=false",
    "-dPreserveOverprintSettings=false",
    "-dUCRandBGInfo=/Remove",
    `-sOutputFile=${outputFile}`,
    stdin ? "-" : JSON.stringify(input),
  ].filter(Boolean);

  return [command, args];
}

function getTimeStamp() {
  const dateFormatStr = `yyyy.mm.dd-HH.MM.ss`;
  return dateformat(new Date(), dateFormatStr);
}

module.exports.parseArgs = parseArgs;
function parseArgs(args = []) {
  const argv = minimist(args, {
    string: ["command", "preset", "colorConversionStrategy"],
    boolean: ["quiet", "help", "stdout"],
    default: {
      quiet: true,
    },
    alias: {
      dpi: "D",
      preset: "P",
      subsetFonts: "subset-fonts",
      compressFonts: "compress-fonts",
      compatibilityLevel: "compatibility-level",
      embedAllFonts: "embed-all-fonts",
      colorConversionStrategy: "color-conversion-strategy",
    },
  });
  const input = argv._[0];
  const output = argv._[1];
  delete argv._;
  return {
    ...argv,
    input,
    output,
  };
}

if (!module.parent) {
  (async () => {
    const opt = parseArgs(process.argv.slice(2));
    if (opt.help) {
      console.log(`
  gsx-pdf-optimize input.pdf [output.pdf] [opts]

  Options:
    --preset, -P   one of: screen (default), printer, prepress, ebook
    --dpi, -D      image resampling resolution in DPI, default 300
    --quiet        enable or disable logging (default quiet=true)
    --command      the Ghostscript command to use, default gsx
    --stdout       pipe to stdout instead of writing to a file
`);
      return;
    }
    try {
      await optimize(opt);
    } catch (err) {
      console.error(err);
    }
  })();
}
