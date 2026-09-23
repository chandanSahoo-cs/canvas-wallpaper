import { defineBackground } from 'wxt/utils/define-background';

export default defineBackground(() => {
  chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({});
  });
});
