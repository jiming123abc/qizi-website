
export const isWeChat = () => {
  if (typeof window === 'undefined') return false;
  return /MicroMessenger/i.test(navigator.userAgent);
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (err) {
    console.error('Failed to copy: ', err);
    return false;
  }
};

/**
 * Note: Configuring WeChat JSSDK requires a server-side signature.
 * This function sets up the basic meta tags and the JSSDK boilerplate.
 */
export const setupWeChatShare = (config: {
  title: string;
  desc: string;
  link: string;
  imgUrl: string;
}) => {
  // Update Meta Tags (for broad compatibility)
  document.title = config.title;
  
  // Open Graph
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', config.title);
  
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', config.desc);
  
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage) ogImage.setAttribute('content', config.imgUrl);
  
  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.setAttribute('content', config.link);

  // If WeChat JS-SDK is loaded, try to update share data
  if ((window as any).wx) {
    const wx = (window as any).wx;
    wx.ready(() => {
      const shareData = {
        title: config.title,
        desc: config.desc,
        link: config.link,
        imgUrl: config.imgUrl,
        success: function () {
          // Optional callback
        }
      };
      wx.updateAppMessageShareData(shareData);
      wx.updateTimelineShareData(shareData);
    });
  }
};

export const injectWeChatSDK = () => {
  if (typeof window === 'undefined' || document.getElementById('wechat-sdk')) return;
  const script = document.createElement('script');
  script.id = 'wechat-sdk';
  script.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js';
  script.async = true;
  document.head.appendChild(script);
};
