# gsx-pdf-optimize

Optimize PDFs with Ghostscript `gsx` command, for example the [test/raw_pdf.pdf](test/raw_pdf.pdf) (generated by Figma) goes from 3.7 MB to 642 KB.

## Install

First, make sure you've installed Ghostscript in your command. In Mac it looks like this:

```sh
brew install ghostscript
```

Then, install this tool globally:

```sh
npm install gsx-pdf-optimize --global
```

## Usage

```
gsx-pdf-optimize input.pdf [output.pdf] [opts]

Options:
  --preset, -P   one of: screen (default), printer, prepress, ebook
  --dpi, -D      image resampling resolution in DPI, default 300
  --quiet        enable or disable logging (default quiet=true)
  --command      the Ghostscript command to use, default gsx
```

You can also override the command with the GSX_OPTIMIZE_COMMAND env var, e.g. if you want to set that in your bash profile.

Examples:

```sh
gsx-pdf-optimize input.pdf
gsx-pdf-optimize input.pdf output.pdf
gsx-pdf-optimize input.pdf --preset=ebook --dpi=96
GSX_OPTIMIZE_COMMAND=gs gsx-pdf-optimize input.pdf output.pdf
```

## Raw Command

Below is the raw command if you'd like to optimize it further yourself. Credit goes to @lkraider and [this gist](https://gist.github.com/lkraider/f0888da30bc352f9d167dfa4f4fc8213).

```sh
gsx -sDEVICE=pdfwrite \
  -dPDFSETTINGS=/screen \
  -dNOPAUSE -dQUIET -dBATCH \
  -dCompatibilityLevel=1.5 \
  `# font settings` \
  -dSubsetFonts=true \
  -dCompressFonts=true \
  -dEmbedAllFonts=true \
  `# color format` \
  -sProcessColorModel=DeviceRGB \
  -sColorConversionStrategy=RGB \
  -sColorConversionStrategyForImages=RGB \
  -dConvertCMYKImagesToRGB=true \
  `# image resample` \
  -dDetectDuplicateImages=true \
  -dColorImageDownsampleType=/Bicubic \
  -dColorImageResolution=300 \
  -dGrayImageDownsampleType=/Bicubic \
  -dGrayImageResolution=300 \
  -dMonoImageDownsampleType=/Bicubic \
  -dMonoImageResolution=300 \
  -dDownsampleColorImages=true \
  `# preset overrides` \
  -dDoThumbnails=false \
  -dCreateJobTicket=false \
  -dPreserveEPSInfo=false \
  -dPreserveOPIComments=false \
  -dPreserveOverprintSettings=false \
  -dUCRandBGInfo=/Remove \
  -sOutputFile=output.pdf \
  input.pdf
```

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/gsx-pdf-optimize/blob/master/LICENSE.md) for details.
