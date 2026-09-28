import esbuild from "esbuild";
import process from "process";

const production = process.argv[2] === "production";

const context = await esbuild.context({
    entryPoints: ["main.ts"],
    bundle: true,
    external: [
        "obsidian",
        "electron",
        "@codemirror/autocomplete",
        "@codemirror/collab",
        "@codemirror/commands",
        "@codemirror/language",
        "@codemirror/lint",
        "@codemirror/search",
        "@codemirror/state",
        "@codemirror/view",
        "@lezer/common",
        "@lezer/highlight",
        "@lezer/lr",
    ],
    format: "cjs",
    target: "es2018",
    logLevel: "info",
    sourcemap: production ? false : "inline",
    outfile: "main.js",
});

if (production) {
    await context.rebuild();
    process.exit(0);
} else {
    await context.watch();
}
