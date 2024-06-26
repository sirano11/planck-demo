export const copyToClipboard = (value: string) => {
  let textarea = document.createElement('textarea');
  document.body.appendChild(textarea);

  textarea.value = value;
  textarea.select();

  document.execCommand('copy');
  document.body.removeChild(textarea);
};
