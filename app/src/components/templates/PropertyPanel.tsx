// app/src/components/templates/PropertyPanel.tsx
"use client";

import { useState } from "react";
import { EmailComponent } from "@/types/template";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { X, Settings } from "lucide-react";
import { getComponent } from "@landivo/email-template";
import { uploadImages } from "@/lib/imageUpload";

interface PropertyPanelProps {
  component: EmailComponent;
  onUpdate: (updates: Partial<EmailComponent>) => void;
  onClose: () => void;
}

export function PropertyPanel({
  component,
  onUpdate,
  onClose,
}: PropertyPanelProps) {
  const [localProps, setLocalProps] = useState(component.props || {});
  const componentMeta = getComponent(component.type);

  const handlePropChange = (key: string, value: any) => {
    const newProps = { ...localProps, [key]: value };
    setLocalProps(newProps);
    onUpdate({ props: newProps });
  };

  const renderConfigField = (field: any) => {
    const value = localProps[field.key] ?? field.defaultValue;

    // Special handling for property image component
    if (component.type === "property-image") {
      // Hide imageIndex when custom URL is selected
      if (field.key === "imageIndex" && localProps.imageSource === "custom") {
        return null;
      }
      // Hide imageUrl when property source is selected
      if (field.key === "imageUrl" && localProps.imageSource !== "custom") {
        return null;
      }
    }

    switch (field.type) {
      case "text":
        // Special handling for uploadButton field
        if (field.key === "uploadButton") {
          return (
            <div key={field.key}>
              <Label className="text-sm font-medium">{field.label}</Label>
              <div className="mt-1">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={async (e) => {
                    const files = e.target.files;
                    if (!files || files.length === 0) return;

                    try {
                      const uploadedImages = await uploadImages(files);
                      if (uploadedImages.length > 0) {
                        handlePropChange("imageUrl", uploadedImages[0].url);
                        handlePropChange("imageSource", "url");
                        alert(`Uploaded ${uploadedImages.length} image(s)`);
                      }
                    } catch (error) {
                      console.error("Upload failed:", error);
                      alert("Upload failed");
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              {field.description && (
                <p className="text-xs text-gray-500 mt-1">
                  {field.description}
                </p>
              )}
            </div>
          );
        }

        // Special handling for imageUrl field with browse button
        if (field.key === "imageUrl") {
          return (
            <div key={field.key}>
              <Label htmlFor={field.key} className="text-sm font-medium">
                {field.label}
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id={field.key}
                  type="text"
                  value={value || field.defaultValue || ""}
                  onChange={(e) => handlePropChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Create a simple modal trigger
                    const modal = document.createElement("div");
                    modal.innerHTML = `
                <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
                  <div style="background: white; padding: 24px; border-radius: 8px; max-width: 500px; width: 90%;">
                    <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Add Image</h3>
                    <div style="margin-bottom: 16px;">
                      <label style="display: block; margin-bottom: 8px; font-weight: 500;">Image URL:</label>
                      <input type="url" id="imageUrlInput" placeholder="https://example.com/image.jpg" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;" value="${value || ""}" />
                    </div>
                    <div style="display: flex; gap: 8px; justify-content: flex-end;">
                      <button onclick="this.closest('[style*=fixed]').remove()" style="padding: 8px 16px; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer;">Cancel</button>
                      <button onclick="
                        const url = document.getElementById('imageUrlInput').value;
                        if (url) {
                          const event = new CustomEvent('imageSelected', { detail: url });
                          window.dispatchEvent(event);
                        }
                        this.closest('[style*=fixed]').remove();
                      " style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">Select</button>
                    </div>
                  </div>
                </div>
              `;
                    document.body.appendChild(modal);

                    // Listen for the image selection
                    const handleImageSelected = (e: any) => {
                      handlePropChange(field.key, e.detail);
                      window.removeEventListener(
                        "imageSelected",
                        handleImageSelected
                      );
                    };
                    window.addEventListener(
                      "imageSelected",
                      handleImageSelected
                    );
                  }}
                  className="px-3"
                >
                  Browse
                </Button>
              </div>
              {field.description && (
                <p className="text-xs text-gray-500 mt-1">
                  {field.description}
                </p>
              )}
            </div>
          );
        }

        // Default text field handling
        return (
          <div key={field.key}>
            <Label htmlFor={field.key} className="text-sm font-medium">
              {field.label}
            </Label>
            <Input
              id={field.key}
              type="text"
              value={value || field.defaultValue || ""}
              onChange={(e) => handlePropChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="mt-1"
            />
            {field.description && (
              <p className="text-xs text-gray-500 mt-1">{field.description}</p>
            )}
          </div>
        );
      case "textarea":
        return (
          <div key={field.key}>
            <Label htmlFor={field.key} className="text-sm font-medium">
              {field.label}
            </Label>
            {field.type === "textarea" ? (
              <textarea
                id={field.key}
                value={value || ""}
                onChange={(e) => handlePropChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm resize-none"
                rows={3}
              />
            ) : (
              <Input
                id={field.key}
                value={value || ""}
                onChange={(e) => handlePropChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="mt-1"
              />
            )}
            {field.description && (
              <p className="text-xs text-gray-500 mt-1">{field.description}</p>
            )}
          </div>
        );

      case "select":
        return (
          <div key={field.key}>
            <Label htmlFor={field.key} className="text-sm font-medium">
              {field.label}
            </Label>
            <Select
              value={value?.toString() || field.defaultValue?.toString()}
              onValueChange={(val) => {
                // Convert back to number for imageIndex
                if (field.key === "imageIndex") {
                  handlePropChange(field.key, parseInt(val));
                } else {
                  handlePropChange(field.key, val);
                }
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map(
                  (option: { label: string; value: string }) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>

            {/* Show file upload when "upload" is selected for imageSource */}
            {field.key === "imageSource" && value === "upload" && (
              <div className="mt-3 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      console.log("Files selected:", files);
                      alert(
                        `Selected ${files.length} image(s). Upload functionality to be implemented.`
                      );
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Select images to upload
                </p>
              </div>
            )}

            {field.description && (
              <p className="text-xs text-gray-500 mt-1">{field.description}</p>
            )}
          </div>
        );

      case "toggle":
      case "boolean":
        return (
          <div key={field.key} className="flex items-center justify-between">
            <div>
              <Label htmlFor={field.key} className="text-sm font-medium">
                {field.label}
              </Label>
              {field.description && (
                <p className="text-xs text-gray-500 mt-1">
                  {field.description}
                </p>
              )}
            </div>
            <Switch
              id={field.key}
              checked={value ?? field.defaultValue}
              onCheckedChange={(checked) =>
                handlePropChange(field.key, checked)
              }
            />
          </div>
        );

      case "color":
        return (
          <div key={field.key}>
            <Label htmlFor={field.key} className="text-sm font-medium">
              {field.label}
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id={field.key}
                type="color"
                value={value || field.defaultValue}
                onChange={(e) => handlePropChange(field.key, e.target.value)}
                className="w-12 h-8 p-1 border rounded"
              />
              <Input
                value={value || field.defaultValue}
                onChange={(e) => handlePropChange(field.key, e.target.value)}
                placeholder="#ffffff"
                className="flex-1"
              />
            </div>
            {field.description && (
              <p className="text-xs text-gray-500 mt-1">{field.description}</p>
            )}
          </div>
        );

      case "number":
        return (
          <div key={field.key}>
            <Label htmlFor={field.key} className="text-sm font-medium">
              {field.label}
            </Label>
            <Input
              id={field.key}
              type="number"
              value={value ?? field.defaultValue}
              onChange={(e) =>
                handlePropChange(field.key, parseInt(e.target.value))
              }
              placeholder={field.placeholder}
              className="mt-1"
            />
            {field.description && (
              <p className="text-xs text-gray-500 mt-1">{field.description}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed bottom-0 right-0 w-80 h-96 bg-white border-l border-t border-gray-200 shadow-lg z-50">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-600" />
          <h3 className="font-medium">
            {componentMeta?.displayName || component.name} Properties
          </h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 overflow-auto h-full pb-16">
        {/* Component Info */}
        <div className="mb-6 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-900">
            {component.name}
          </div>
          <div className="text-xs text-gray-600 mt-1">ID: {component.id}</div>
          <div className="text-xs text-gray-600">Type: {component.type}</div>
        </div>

        {/* Component Properties */}
        <div className="space-y-4">
          {componentMeta?.configFields.length ? (
            componentMeta.configFields.map(renderConfigField)
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                No properties available for this component
              </p>
            </div>
          )}
        </div>

        {/* Component Actions */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() =>
                onUpdate({
                  name:
                    prompt("Enter new name:", component.name) || component.name,
                })
              }
            >
              Rename Component
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => {
                if (confirm("Delete this component?")) {
                  onClose();
                }
              }}
            >
              Delete Component
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
