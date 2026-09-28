# Pollinations for Obsidian

Generate text and images with [Pollinations](https://gen.pollinations.ai) inside your notes, paying with your own Pollen.

Built for [pollinations/pollinations#15574](https://github.com/pollinations/pollinations/issues/15574).

## Install

**Manual install** (not yet in the community plugin directory):

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/tomdacatto/pollinations-obsidian/releases).
2. Copy them into `<your vault>/.obsidian/plugins/pollinations/`.
3. In Obsidian: **Settings → Community plugins**, enable **Pollinations**.

**From source:**

```bash
git clone https://github.com/tomdacatto/pollinations-obsidian
cd pollinations-obsidian
npm install
npm run build
```

Then copy `main.js`, `manifest.json`, and `styles.css` into your vault's plugin folder as above.

## Setup

1. Get a free API key at [enter.pollinations.ai/keys](https://enter.pollinations.ai/keys).
2. **Settings → Pollinations**, paste it into **API key**.
3. Optionally set a **Text model** or **Image model** — any id from the live lists at [gen.pollinations.ai/text/models](https://gen.pollinations.ai/text/models) or [/image/models](https://gen.pollinations.ai/image/models). Defaults to `openai` and `flux`.

## Use

Open the command palette (`Ctrl/Cmd+P`) and run:

- **Pollinations: Generate text from selection or prompt** — with text selected, replaces it with the model's reply; with nothing selected, asks for a prompt and inserts the reply at the cursor.
- **Pollinations: Generate image from selection or prompt** — same selection-or-prompt behavior, but downloads a generated image into a `pollinations/` folder in your vault and embeds it (`![[pollinations/....png]]`) at the cursor.

Bind either command to a hotkey in **Settings → Hotkeys** for faster access.

## How it talks to Pollinations

All requests go straight from Obsidian to `gen.pollinations.ai` using Obsidian's `requestUrl` (no separate backend, no data sent anywhere else). Text uses the OpenAI-compatible `/v1/chat/completions` endpoint; images use the `/image/<prompt>` endpoint and are saved as vault attachments.

## Status

Built and type-checked (`npm run build` passes cleanly against the `obsidian` API types); not yet run inside a live Obsidian vault (no desktop Obsidian install in the build environment). [Issues](https://github.com/tomdacatto/pollinations-obsidian/issues) and PRs welcome.

## Credit

Uses the [Pollinations API](https://pollinations.ai). Thanks to [Polinations-AI-Chat](https://github.com/Processori7/Polinations-AI-Chat) for prior art referenced while designing this plugin.

## License

MIT
