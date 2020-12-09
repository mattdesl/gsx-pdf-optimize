const optimize = require("./");
const execa = require("execa");

(async () => {
  const { stdout } = optimize.spawn({
    input: "test/raw_pdf.pdf",
    stdout: true,
  });
  stdout.pipe(process.stdout);
})();
