// ==UserScript==
// @name         NicoNico Image Downloader
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Download lazyload images from Nico Nico Seiga
// @author       Aiden's
// @match        https://seiga.nicovideo.jp/watch/*
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js
// ==/UserScript==

(function () {
  'use strict';

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function fetchImage(url) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: url,
        responseType: 'arraybuffer',
        onload: (response) => {
          if (response.status === 200) {
            resolve(response.response);
          } else {
            reject(new Error(`Failed to fetch image: ${response.statusText}`));
          }
        },
        onerror: (error) => {
          reject(error);
        },
      });
    });
  }

  async function downloadImages() {
    const zip = new JSZip();
    const imageElements = $('img.lazyload[data-original]');

    for (let i = 0; i < imageElements.length; i++) {
      const imgElement = $(imageElements[i]);
      const imageUrl = imgElement.data('original');
      const imageId = imgElement.data('image-id');
      const fileExtension = imageUrl.split('.').pop();
      const fileName = `image_${imageId}.${fileExtension}`;

      try {
        const imageData = await fetchImage(imageUrl);
        zip.file(fileName, imageData);
        await sleep(500);
      } catch (error) {
        console.error(`Error downloading image ${imageId}:`, error);
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipUrl = URL.createObjectURL(zipBlob);
    const downloadLink = $('<a>')
      .attr('href', zipUrl)
      .attr('download', 'niconico_images.zip')
      .css('display', 'none');

    $('body').append(downloadLink);
    downloadLink[0].click();
    URL.revokeObjectURL(zipUrl);
    downloadLink.remove();
  }

  $(document).ready(function () {
    const downloadButton = $('<button>')
      .css({
        position: 'fixed',
        top: '60px', // Moved button down
        right: '10px',
        zIndex: 9999,
        padding: '10px',
        background: '#3db9f7',
        color: 'white',
        fontWeight: 'bold',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
      })
      .text('Download Images')
      .click(downloadImages);

    $('body').append(downloadButton);
  });
})();
