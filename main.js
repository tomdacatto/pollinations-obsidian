"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => PollinationsPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  apiKey: "",
  textModel: "openai",
  imageModel: "flux"
};
var BASE_URL = "https://gen.pollinations.ai";
var PollinationsPlugin = class extends import_obsidian.Plugin {
  async onload() {
    await this.loadSettings();
    this.addCommand({
      id: "generate-text",
      name: "Generate text from selection or prompt",
      editorCallback: (editor) => this.generateText(editor)
    });
    this.addCommand({
      id: "generate-image",
      name: "Generate image from selection or prompt",
      editorCallback: (editor) => this.generateImage(editor)
    });
    this.addSettingTab(new PollinationsSettingTab(this.app, this));
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  requireKey() {
    if (!this.settings.apiKey) {
      new import_obsidian.Notice("Set a Pollinations API key in Settings \u2192 Pollinations first.");
      return null;
    }
    return this.settings.apiKey;
  }
  promptForText(title) {
    return new Promise((resolve) => new PromptModal(this.app, title, resolve).open());
  }
  async generateText(editor) {
    var _a, _b, _c, _d;
    const key = this.requireKey();
    if (!key) return;
    const selection = editor.getSelection();
    const prompt = selection || await this.promptForText("What should Pollinations write?");
    if (!prompt) return;
    const notice = new import_obsidian.Notice("Generating text...", 0);
    try {
      const res = await (0, import_obsidian.requestUrl)({
        url: `${BASE_URL}/v1/chat/completions`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`
        },
        body: JSON.stringify({
          model: this.settings.textModel,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const content = (_d = (_c = (_b = (_a = res.json) == null ? void 0 : _a.choices) == null ? void 0 : _b[0]) == null ? void 0 : _c.message) == null ? void 0 : _d.content;
      if (!content) throw new Error("No content in the response.");
      if (selection) {
        editor.replaceSelection(content);
      } else {
        editor.replaceRange(content, editor.getCursor());
      }
    } catch (error) {
      new import_obsidian.Notice(`Pollinations text generation failed: ${errorMessage(error)}`);
    } finally {
      notice.hide();
    }
  }
  async generateImage(editor) {
    const key = this.requireKey();
    if (!key) return;
    const selection = editor.getSelection();
    const prompt = selection || await this.promptForText("Describe the image to generate");
    if (!prompt) return;
    const notice = new import_obsidian.Notice("Generating image...", 0);
    try {
      const res = await (0, import_obsidian.requestUrl)({
        url: `${BASE_URL}/image/${encodeURIComponent(prompt)}?model=${encodeURIComponent(this.settings.imageModel)}`,
        method: "GET",
        headers: { Authorization: `Bearer ${key}` }
      });
      const folder = "pollinations";
      if (!await this.app.vault.adapter.exists(folder)) {
        await this.app.vault.createFolder(folder);
      }
      const contentType = (res.headers["content-type"] || res.headers["Content-Type"] || "").split(";")[0].toLowerCase();
      const extension = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif"
      }[contentType];
      if (!extension) throw new Error(`Unsupported image format: ${contentType || "unknown"}`);
      const path = (0, import_obsidian.normalizePath)(`${folder}/${Date.now()}.${extension}`);
      await this.app.vault.createBinary(path, res.arrayBuffer);
      if (selection) {
        editor.replaceSelection(`![[${path}]]`);
      } else {
        editor.replaceRange(`![[${path}]]`, editor.getCursor());
      }
    } catch (error) {
      new import_obsidian.Notice(`Pollinations image generation failed: ${errorMessage(error)}`);
    } finally {
      notice.hide();
    }
  }
};
function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
var PromptModal = class extends import_obsidian.Modal {
  constructor(app, title, resolve) {
    super(app);
    this.title = title;
    this.resolve = resolve;
    this.value = "";
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: this.title });
    const input = contentEl.createEl("input", { type: "text" });
    input.style.width = "100%";
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        this.value = input.value;
        this.close();
      }
    });
    new import_obsidian.Setting(contentEl).addButton(
      (button) => button.setButtonText("Generate").setCta().onClick(() => {
        this.value = input.value;
        this.close();
      })
    );
    window.setTimeout(() => input.focus(), 0);
  }
  onClose() {
    this.contentEl.empty();
    this.resolve(this.value.trim() || null);
  }
};
var PollinationsSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName("API key").setDesc("From https://enter.pollinations.ai/keys").addText(
      (text) => text.setPlaceholder("sk_...").setValue(this.plugin.settings.apiKey).onChange(async (value) => {
        this.plugin.settings.apiKey = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Text model").setDesc("Any model id from https://gen.pollinations.ai/text/models").addText(
      (text) => text.setValue(this.plugin.settings.textModel).onChange(async (value) => {
        this.plugin.settings.textModel = value.trim() || DEFAULT_SETTINGS.textModel;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Image model").setDesc("Any model id from https://gen.pollinations.ai/image/models").addText(
      (text) => text.setValue(this.plugin.settings.imageModel).onChange(async (value) => {
        this.plugin.settings.imageModel = value.trim() || DEFAULT_SETTINGS.imageModel;
        await this.plugin.saveSettings();
      })
    );
  }
};
