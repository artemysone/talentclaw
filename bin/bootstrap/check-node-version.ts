export function checkNodeVersion(): void {
  const [major] = process.versions.node.split(".").map(Number);
  if (major < 22) {
    console.error(
      `\ntalentclaw requires Node.js 22 or later (you have ${process.versions.node}).` +
        `\nInstall the latest LTS from https://nodejs.org or use a version manager like fnm / nvm.\n`,
    );
    process.exit(1);
  }
}
