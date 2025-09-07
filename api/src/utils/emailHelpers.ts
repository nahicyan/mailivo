// ============================================
// api/src/utils/emailHelpers.ts
// ============================================
/**
 * Email-safe image wrapper for maximum compatibility
 */
export function wrapImageForEmail(imageHtml: string, alignment: string = 'center'): string {
  const alignmentMap: Record<string, string> = {
    left: 'left',
    center: 'center',
    right: 'right'
  };

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td align="${alignmentMap[alignment] || 'center'}">
          ${imageHtml}
        </td>
      </tr>
    </table>
  `;
}

/**
 * Generate responsive image HTML for emails
 */
export function generateResponsiveImageHtml(
  src: string,
  alt: string,
  width: number,
  link?: string
): string {
  const imageHtml = `
    <img 
      src="${src}" 
      alt="${alt}" 
      width="${width}" 
      style="
        display: block;
        width: 100%;
        max-width: ${width}px;
        height: auto;
        border: 0;
        outline: none;
        text-decoration: none;
        -ms-interpolation-mode: bicubic;
      "
    />
  `;

  if (link) {
    return `
      <a href="${link}" target="_blank" style="text-decoration: none;">
        ${imageHtml}
      </a>
    `;
  }

  return imageHtml;
}