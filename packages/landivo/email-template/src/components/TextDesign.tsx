// packages/landivo/email-template/src/components/TextDesign.tsx
import React from "react";
import { Section, Text, Link, Img } from "@react-email/components";
import { Type } from "lucide-react";
import { EmailComponentMetadata } from "../types/component-metadata";

interface TextDesignProps {
  className?: string;
  backgroundColor?: string;
  borderRadius?: number;
  showBorder?: boolean;
  spacing?: number;
  text?: string;
  enableLineBreaks?: boolean; // ADD THIS PROP
  textAlign?: "left" | "center" | "right";
  textSize?:
    | "xs"
    | "sm"
    | "base"
    | "lg"
    | "xl"
    | "2xl"
    | "3xl"
    | "4xl"
    | "5xl"
    | "6xl"
    | "7xl"
    | "8xl";
  textColor?: string;
  fontWeight?: "normal" | "medium" | "semibold" | "bold" | "black";
  fontStyle?: "normal" | "italic";
  lineHeight?: number;
  letterSpacing?: number;
  textDecoration?: "none" | "underline" | "line-through";
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  fontFamily?: string;
  // Link properties
  isLink?: boolean;
  linkUrl?: string;
  linkColor?: string;
  // Email-safe visual effects
  textShadow?: boolean;
  shadowColor?: string;
  shadowIntensity?: "light" | "medium" | "heavy";
  // Advanced styling
  borderWidth?: number;
  borderColor?: string;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  maxWidth?: number;
  // Image-based text option (for complex fonts)
  useImageText?: boolean;
  imageUrl?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
}

export function TextDesign({
  className = "",
  backgroundColor = "transparent",
  borderRadius = 0,
  showBorder = false,
  spacing = 16,
  text = "Your text here",
  enableLineBreaks = false, // ADD DEFAULT VALUE
  textAlign = "left",
  textSize = "base",
  textColor = "#1f2937",
  fontWeight = "normal",
  fontStyle = "normal",
  lineHeight = 1.5,
  letterSpacing = 0,
  textDecoration = "none",
  textTransform = "none",
  fontFamily = "Arial, Helvetica, sans-serif",
  // Link properties
  isLink = false,
  linkUrl = "#",
  linkColor = "#2563eb",
  // Email-safe visual effects
  textShadow = false,
  shadowColor = "#00000040",
  shadowIntensity = "medium",
  // Advanced styling
  borderWidth = 1,
  borderColor = "#e5e7eb",
  paddingTop = 16,
  paddingBottom = 16,
  paddingLeft = 16,
  paddingRight = 16,
  maxWidth = 600,
  // Image-based text option
  useImageText = false,
  imageUrl = "",
  imageAlt = "",
  imageWidth = 300,
  imageHeight = 100,
}: TextDesignProps) {
  // Convert text size to pixel values optimized for email
  const getFontSize = (size: string): string => {
    const sizeMap = {
      xs: "12px",
      sm: "14px",
      base: "16px",
      lg: "18px",
      xl: "20px",
      "2xl": "24px",
      "3xl": "30px",
      "4xl": "36px",
      "5xl": "48px",
      "6xl": "60px",
      "7xl": "72px",
      "8xl": "96px",
    };
    return sizeMap[size as keyof typeof sizeMap] || "16px";
  };

  // Convert font weight to values that work in email
  const getFontWeight = (weight: string): string => {
    const weightMap = {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      black: "900",
    };
    return weightMap[weight as keyof typeof weightMap] || "400";
  };

  // Email-compatible text shadow
  const getTextShadow = (): string => {
    if (!textShadow) return "none";

    const shadowSettings = {
      light: "1px 1px 1px",
      medium: "2px 2px 4px",
      heavy: "3px 3px 6px",
    };

    const shadow = shadowSettings[shadowIntensity] || shadowSettings.medium;
    return `${shadow} ${shadowColor}`;
  };

  // Container styles
  const containerStyle = {
    backgroundColor,
    borderRadius: `${borderRadius}px`,
    border: showBorder ? `${borderWidth}px solid ${borderColor}` : "none",
    padding: `${spacing}px`,
  };

  // Enhanced text styles for maximum email compatibility
  const textStyle = {
    fontSize: getFontSize(textSize),
    fontWeight: getFontWeight(fontWeight),
    fontStyle,
    color: textColor,
    textAlign,
    lineHeight: lineHeight.toString(),
    letterSpacing: `${letterSpacing}px`,
    textDecoration,
    textTransform,
    textShadow: getTextShadow(),
    paddingTop: `${paddingTop}px`,
    paddingBottom: `${paddingBottom}px`,
    paddingLeft: `${paddingLeft}px`,
    paddingRight: `${paddingRight}px`,
    margin: "0",
    fontFamily: fontFamily,
    wordWrap: "break-word" as const,
    wordBreak: "break-word" as const,
    display: "block" as const,
    // Additional email-safe properties
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const,
  };

  // Link-specific styles
  const linkStyle = {
    ...textStyle,
    color: linkColor,
    textDecoration: "underline",
    cursor: "pointer",
  };

  // Render image-based text (for complex decorative fonts)
  if (useImageText && imageUrl) {
    const imageElement = (
      <Img
        src={imageUrl}
        alt={imageAlt || text}
        width={imageWidth}
        height={imageHeight}
        style={{
          maxWidth: "100%",
          height: "auto",
          display: "block",
          margin:
            textAlign === "center"
              ? "0 auto"
              : textAlign === "right"
                ? "0 0 0 auto"
                : "0 auto 0 0",
        }}
      />
    );

    const content =
      isLink && linkUrl ? (
        <Link href={linkUrl}>{imageElement}</Link>
      ) : (
        imageElement
      );

    return (
      <Section
        className={className}
        style={{
          width: "100%",
        }}
      >
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            width: "100%",
          }}
        >
          <div style={containerStyle}>{content}</div>
        </div>
      </Section>
    );
  }

  // Render text content
  const renderTextContent = () => {
    // Process text for line breaks if enabled
    const processedText = enableLineBreaks
      ? text.replace(/\n/g, "<br />")
      : text;

    // For links
    if (isLink && linkUrl) {
      if (enableLineBreaks) {
        // Use dangerouslySetInnerHTML for links with line breaks
        return (
          <Text style={linkStyle}>
            <Link
              href={linkUrl}
              style={{ ...linkStyle, textDecoration: "underline" }}
              dangerouslySetInnerHTML={{ __html: processedText }}
            />
          </Text>
        );
      }
      return (
        <Text style={linkStyle}>
          <Link
            href={linkUrl}
            style={{ ...linkStyle, textDecoration: "underline" }}
          >
            {text}
          </Link>
        </Text>
      );
    }

    // For regular text
    if (enableLineBreaks) {
      // Use dangerouslySetInnerHTML for text with line breaks
      return (
        <Text
          style={textStyle}
          dangerouslySetInnerHTML={{ __html: processedText }}
        />
      );
    }

    return <Text style={textStyle}>{text}</Text>;
  };

  return (
    <Section
      className={className}
      style={{
        width: "100%",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div style={containerStyle}>{renderTextContent()}</div>
      </div>
    </Section>
  );
}

// Component metadata for the template builder
export const textDesignMetadata: EmailComponentMetadata = {
  type: "text-design",
  name: "text-design",
  displayName: "Text Design",
  version: "v1.0",
  icon: <Type className="w-5 h-5" />,
  description:
    "Create styled text with email-safe fonts and effects, or use custom images for complex designs",
  category: "content",
  available: true,
  defaultProps: {
    className: "",
    backgroundColor: "transparent",
    borderRadius: 0,
    showBorder: false,
    spacing: 16,
    text: "Your text here",
    enableLineBreaks: false, // ADD THIS TO DEFAULT PROPS
    textAlign: "left",
    textSize: "base",
    textColor: "#1f2937",
    fontWeight: "normal",
    fontStyle: "normal",
    lineHeight: 1.5,
    letterSpacing: 0,
    textDecoration: "none",
    textTransform: "none",
    fontFamily: "Arial, Helvetica, sans-serif",
    isLink: false,
    linkUrl: "#",
    linkColor: "#2563eb",
    textShadow: false,
    shadowColor: "#00000040",
    shadowIntensity: "medium",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 16,
    paddingRight: 16,
    maxWidth: 600,
    useImageText: false,
    imageUrl: "",
    imageAlt: "",
    imageWidth: 300,
    imageHeight: 100,
  },
  configFields: [
    {
      key: "text",
      label: "Text Content",
      type: "textarea",
      defaultValue: "Your text here",
      description: "The text to display",
    },
    {
      key: "enableLineBreaks",
      label: "Enable Line Breaks",
      type: "toggle",
      defaultValue: false,
      description: "📝 Allow line breaks when you press Enter in text content",
    },
    // ... rest of the config fields remain the same
    {
      key: "textAlign",
      label: "Text Alignment",
      type: "select",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
      defaultValue: "left",
      description: "Text alignment",
    },
    {
      key: "fontFamily",
      label: "Font Family (Email-Safe)",
      type: "select",
      options: [
        {
          label: "Arial - Clean & Modern",
          value: "Arial, Helvetica, sans-serif",
        },
        {
          label: "Impact - Bold Headlines",
          value: 'Impact, "Arial Black", sans-serif',
        },
        {
          label: "Georgia - Elegant Serif",
          value: 'Georgia, "Times New Roman", serif',
        },
        {
          label: "Times New Roman - Classic",
          value: '"Times New Roman", Times, serif',
        },
        {
          label: "Trebuchet MS - Friendly",
          value: '"Trebuchet MS", Helvetica, sans-serif',
        },
        {
          label: "Verdana - Highly Readable",
          value: "Verdana, Geneva, sans-serif",
        },
        {
          label: "Comic Sans MS - Playful/Casual",
          value: '"Comic Sans MS", "Marker Felt", cursive',
        },
        {
          label: "Brush Script MT - Handwritten",
          value: '"Brush Script MT", cursive',
        },
        {
          label: "Palatino - Sophisticated",
          value: '"Palatino Linotype", "Book Antiqua", Palatino, serif',
        },
        {
          label: "Courier New - Typewriter",
          value: '"Courier New", Courier, monospace',
        },
      ],
      defaultValue: "Arial, Helvetica, sans-serif",
      description: "✅ Fonts guaranteed to work in all email clients",
    },
    {
      key: "textSize",
      label: "Font Size",
      type: "select",
      options: [
        { label: "Extra Small (12px)", value: "xs" },
        { label: "Small (14px)", value: "sm" },
        { label: "Base (16px)", value: "base" },
        { label: "Large (18px)", value: "lg" },
        { label: "Extra Large (20px)", value: "xl" },
        { label: "2X Large (24px)", value: "2xl" },
        { label: "3X Large (30px)", value: "3xl" },
        { label: "4X Large (36px)", value: "4xl" },
        { label: "5X Large (48px)", value: "5xl" },
        { label: "6X Large (60px)", value: "6xl" },
        { label: "7X Large (72px)", value: "7xl" },
        { label: "8X Large (96px)", value: "8xl" },
      ],
      defaultValue: "base",
      description: "Font size - use 4xl+ for headline effects",
    },
    {
      key: "textColor",
      label: "Text Color",
      type: "color",
      defaultValue: "#1f2937",
      description: "Color of the text",
    },
    {
      key: "fontWeight",
      label: "Font Weight",
      type: "select",
      options: [
        { label: "Normal", value: "normal" },
        { label: "Medium", value: "medium" },
        { label: "Semi Bold", value: "semibold" },
        { label: "Bold", value: "bold" },
        { label: "Black (Extra Bold)", value: "black" },
      ],
      defaultValue: "normal",
      description: "Font weight - use Bold/Black for impact",
    },
    {
      key: "fontStyle",
      label: "Font Style",
      type: "select",
      options: [
        { label: "Normal", value: "normal" },
        { label: "Italic", value: "italic" },
      ],
      defaultValue: "normal",
      description: "Font style",
    },
    {
      key: "textShadow",
      label: "Text Shadow Effect",
      type: "toggle",
      defaultValue: false,
      description: "✨ Add shadow to make text pop (email-compatible)",
    },
    {
      key: "shadowIntensity",
      label: "Shadow Intensity",
      type: "select",
      options: [
        { label: "Light", value: "light" },
        { label: "Medium", value: "medium" },
        { label: "Heavy", value: "heavy" },
      ],
      defaultValue: "medium",
      description: "How strong the shadow effect appears",
    },
    {
      key: "shadowColor",
      label: "Shadow Color",
      type: "color",
      defaultValue: "#00000040",
      description: "Color of the text shadow",
    },
    {
      key: "letterSpacing",
      label: "Letter Spacing",
      type: "number",
      defaultValue: 0,
      description: "Letter spacing in pixels (try 1-3px for headlines)",
    },
    {
      key: "lineHeight",
      label: "Line Height",
      type: "number",
      defaultValue: 1.2,
      description: "Line height multiplier (try 1.1-1.2 for headlines)",
    },
    {
      key: "textTransform",
      label: "Text Transform",
      type: "select",
      options: [
        { label: "None", value: "none" },
        { label: "UPPERCASE", value: "uppercase" },
        { label: "lowercase", value: "lowercase" },
        { label: "Capitalize", value: "capitalize" },
      ],
      defaultValue: "none",
      description: "Text case transformation",
    },
    {
      key: "textDecoration",
      label: "Text Decoration",
      type: "select",
      options: [
        { label: "None", value: "none" },
        { label: "Underline", value: "underline" },
        { label: "Line Through", value: "line-through" },
      ],
      defaultValue: "none",
      description: "Text decoration style",
    },
    {
      key: "isLink",
      label: "Make Clickable Link",
      type: "toggle",
      defaultValue: false,
      description: "Convert text to a clickable link",
    },
    {
      key: "linkUrl",
      label: "Link URL",
      type: "text",
      defaultValue: "#",
      description: "URL for the link (when clickable is enabled)",
    },
    {
      key: "linkColor",
      label: "Link Color",
      type: "color",
      defaultValue: "#2563eb",
      description: "Color of the link text",
    },
    {
      key: "backgroundColor",
      label: "Background Color",
      type: "color",
      defaultValue: "transparent",
      description: "Background color of the text container",
    },
    {
      key: "borderRadius",
      label: "Border Radius",
      type: "number",
      defaultValue: 0,
      description: "Corner radius in pixels",
    },
    {
      key: "showBorder",
      label: "Show Border",
      type: "toggle",
      defaultValue: false,
      description: "Display border around the text",
    },
    {
      key: "borderColor",
      label: "Border Color",
      type: "color",
      defaultValue: "#e5e7eb",
      description: "Color of the border",
    },
    {
      key: "paddingTop",
      label: "Padding Top",
      type: "number",
      defaultValue: 16,
      description: "Top padding in pixels",
    },
    {
      key: "paddingBottom",
      label: "Padding Bottom",
      type: "number",
      defaultValue: 16,
      description: "Bottom padding in pixels",
    },
    {
      key: "paddingLeft",
      label: "Padding Left",
      type: "number",
      defaultValue: 16,
      description: "Left padding in pixels",
    },
    {
      key: "paddingRight",
      label: "Padding Right",
      type: "number",
      defaultValue: 16,
      description: "Right padding in pixels",
    },
    {
      key: "maxWidth",
      label: "Max Width",
      type: "number",
      defaultValue: 600,
      description: "Maximum width in pixels",
    },
    {
      key: "className",
      label: "CSS Classes",
      type: "text",
      placeholder: "Additional CSS classes",
      description: "Add custom CSS classes for styling",
    },
  ],
  component: TextDesign,
};

export default TextDesign;
