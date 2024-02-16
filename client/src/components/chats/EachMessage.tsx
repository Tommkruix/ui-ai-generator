import hljs from 'highlight.js';
import { marked } from "marked";
import 'highlight.js/styles/tomorrow-night-bright.css';
import { useEffect } from 'react';
import { showToast } from '@/libs/toastify';
import { ChatMessage } from '@/types/chats';
import html2canvas from 'html2canvas';
import * as htmlToImage from 'html-to-image';

interface EachMessageProps {
  singleMessage: ChatMessage;
}

export default function EachMessage({ singleMessage }: EachMessageProps) {
  useEffect(() => {
    const iframe = document.querySelector(`.ui-preview-tab-${singleMessage.id} iframe`) as HTMLIFrameElement | null;

    if (iframe) {
      iframe.addEventListener('load', () => {
        const body = iframe.contentWindow?.document.body;
        const html = iframe.contentWindow?.document.documentElement;
        const height = Math.max(body?.scrollHeight || 0, body?.offsetHeight || 0, html?.clientHeight || 0, html?.scrollHeight || 0, html?.offsetHeight || 0);
        iframe.style.height = (height + 60) + 'px';
      });
    }
    document.querySelectorAll(`.ui-message-block-${singleMessage.id} pre code`).forEach((block: Element) => {
      const htmlBlock = block as HTMLElement;
      let languageName = "";
      hljs.configure({ ignoreUnescapedHTML: true });
      try {
        hljs.highlightElement(htmlBlock);
      } catch (e) {
        htmlBlock.className = htmlBlock.className.replace(languageName, 'ts');
        hljs.highlightElement(htmlBlock);
      }
      if (htmlBlock.classList.contains('language-vue')) {
        htmlBlock.classList.remove('language-vue');
        htmlBlock.classList.add('language-ts');
        languageName = "vue";
      }
      else {
        languageName = htmlBlock.className.split('-')[1].split(' ')[0];
      }

      htmlBlock.classList.add("w-[calc(100vw-110px)]", "md:w-[604px]", '!rounded-b-md', 'overflow-hidden');

      const existingDiv = htmlBlock.parentNode?.querySelector(`.ui-message-action-${singleMessage.id}`);
      if (!existingDiv) {
        const codeBlockHeader = document.createElement('div');
        codeBlockHeader.classList.add(`ui-message-action-${singleMessage.id}`, "w-[calc(100vw-110px)]", "md:w-[604px]", 'flex', 'items-center', 'relative', 'text-gray-200', 'bg-[#343541]', 'px-4', 'py-2', 'text-xs', 'font-sans', 'justify-between', 'rounded-t-md', 'mt-5');

        codeBlockHeader.innerHTML = `<span class="text-[#ACACBE] flex">${languageName}</span>
        <button class="flex items-center space-x-2 text-[#D9D9E3] ui-download-image"><svg width="13" height="13" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M1 11C1.55228 11 2 11.4477 2 12V14C2 15.1046 2.89543 16 4 16H14C15.1046 16 16 15.1046 16 14V12C16 11.4477 16.4477 11 17 11C17.5523 11 18 11.4477 18 12V14C18 16.2091 16.2091 18 14 18H4C1.79086 18 0 16.2091 0 14V12C0 11.4477 0.447715 11 1 11Z" fill="currentColor"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M8.99999 12.5C9.26521 12.5 9.51956 12.3946 9.7071 12.2071L13.2071 8.70711C13.5976 8.31659 13.5976 7.68342 13.2071 7.2929C12.8166 6.90237 12.1834 6.90237 11.7929 7.29289L9.99999 9.08579V1C9.99999 0.447715 9.55227 0 8.99999 0C8.4477 0 7.99999 0.447715 7.99999 1V9.08578L6.20711 7.2929C5.81658 6.90237 5.18342 6.90237 4.79289 7.29289C4.40237 7.68342 4.40237 8.31658 4.79289 8.70711L8.29288 12.2071C8.48042 12.3946 8.73477 12.5 8.99999 12.5Z" fill="currentColor"/>
        </svg>
        
        <span>Download preview</span>
        </button>
        <button class=" items-center space-x-2 text-[#D9D9E3] hidden ui-copy-code"><svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8.125 2.70833H9.20833C9.80664 2.70833 10.2917 3.19336 10.2917 3.79167V10.2917C10.2917 10.89 9.80664 11.375 9.20833 11.375H3.79166C3.19335 11.375 2.70833 10.89 2.70833 10.2917V3.79167C2.70833 3.19336 3.19335 2.70833 3.79166 2.70833H4.87499M8.125 2.70833V3.79167H4.87499V2.70833M8.125 2.70833C8.125 2.11002 7.63997 1.625 7.04166 1.625H5.95833C5.36002 1.625 4.87499 2.11002 4.87499 2.70833" stroke="#D9D9E3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Copy code</span>
        </button>`;


        const tabElement = document.createElement('div');
        tabElement.classList.add(`ui-switch-tab-action-${singleMessage.id}`, 'font-sans', 'flex', 'mt-10', 'text-sm');
        tabElement.innerHTML = `
  <span class="bg-[#EDEDED] rounded-xl p-1 flex">
    <button class="px-2.5 py-1 rounded-lg bg-white border border-[#E4E4E4] text-[#007AFF] font-medium">Preview</button>
    <button class="px-2.5 py-1 rounded-lg">Source code</button>
  </span>`;

        const previewElement = document.createElement('div');
        previewElement.classList.add(`ui-preview-tab-${singleMessage.id}`);
        previewElement.innerHTML = `
  <iframe
    style="width: 100%; height: auto; border: none; background: #000; padding: 20px; border-radius:0 0 8px 8px; margin-top: -65px;"
    srcDoc="${singleMessage.vanilla?.replace(/"/g, '&quot;')}"
    title="Preview"
  ></iframe>`;


        htmlBlock.parentNode?.prepend(previewElement);
        htmlBlock.parentNode?.prepend(codeBlockHeader);
        htmlBlock.parentNode?.prepend(tabElement);

        htmlBlock.classList.add('!hidden');
        // codeBlockHeader.classList.add('hidden');

        const previewButton = tabElement.querySelector('button:first-child');
        const sourceCodeButton = tabElement.querySelector('button:last-child');


        previewButton?.addEventListener('click', () => {
          previewElement.classList.remove('hidden');
          htmlBlock.classList.add('!hidden');
          previewButton.classList.add('bg-white', 'border', 'border-[#E4E4E4]', 'text-[#007AFF]', 'font-medium');
          sourceCodeButton?.classList.remove('bg-white', 'border', 'border-[#E4E4E4]', 'text-[#007AFF]', 'font-medium');
          if (htmlBlock.parentElement) {
            htmlBlock.parentElement.querySelector('.ui-download-image')?.classList.remove('hidden');
            htmlBlock.parentElement.querySelector('.ui-copy-code')?.classList.add('hidden');
          }
        });

        sourceCodeButton?.addEventListener('click', () => {
          previewElement.classList.add('hidden');
          htmlBlock.classList.remove('!hidden');
          if (htmlBlock.parentElement) {
            htmlBlock.parentElement.querySelector('.ui-download-image')?.classList.add('hidden');
            htmlBlock.parentElement.querySelector('.ui-copy-code')?.classList.remove('hidden');
            htmlBlock.parentElement.querySelector('.ui-copy-code')?.classList.add('flex');
          }
          sourceCodeButton.classList.add('bg-white', 'border', 'border-[#E4E4E4]', 'text-[#007AFF]', 'font-medium');
          previewButton?.classList.remove('bg-white', 'border', 'border-[#E4E4E4]', 'text-[#007AFF]', 'font-medium');
        });


        codeBlockHeader.querySelector(".ui-copy-code")?.addEventListener('click', () => {
          navigator.clipboard.writeText(htmlBlock.textContent || '');
          showToast("Copied to clipboard", "success");
        });

        codeBlockHeader.querySelector(".ui-download-image")?.addEventListener('click', async () => {
          const iframe = document.querySelector(`.ui-preview-tab-${singleMessage.id} iframe`) as HTMLIFrameElement | null;
          if (!iframe || !iframe.contentDocument || !iframe.contentWindow) {
            console.error('Unable to access iframe content');
            return;
          }

          const iframeBody = iframe.contentDocument.body;

          htmlToImage.toPng(iframeBody)
            .then(function (dataUrl) {
              const link = document.createElement('a');
              link.download = "image_" + new Date().getTime() + '.png';
              link.href = dataUrl;
              link.click();
            })
            .catch(async function (error) {
              console.error('Error converting iframe to image with html-to-image:', error);
              try {
                const canvas = await html2canvas(iframeBody, {
                  windowWidth: iframe.scrollWidth,
                  windowHeight: iframe.scrollHeight,
                  scrollX: 0, scrollY: 0,
                });

                const link = document.createElement('a');
                link.download = "image_" + new Date().getTime() + '.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
              } catch (error) {
                console.error('Error capturing iframe content with html2canvas:', error);
              }
            });



        });
      }

    });
    document.querySelectorAll(`.ui-message-block-${singleMessage.id} :not(pre) > code`).forEach((block: Element) => {
      const htmlBlock = block as HTMLElement;
      htmlBlock.classList.add('text-black', 'font-medium', 'underline', 'text-opacity-100');
    });


  }, [singleMessage.message, singleMessage.id]);



  return (
    <div>
      <div className={`ui-message-box ui-message-block-${singleMessage.id} transition duration-500 ease-in-out`}
        dangerouslySetInnerHTML={{
          __html: marked.parse(singleMessage.message, {
            mangle: false,
            headerIds: false,
            allowUnsafeHTML: true
          })
        }}
      />
    </div>
  );
}
