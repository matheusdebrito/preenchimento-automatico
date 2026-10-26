import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { DEMO_INITIAL_REVIEW_VALUES } from '../../data/demo';

export interface LocalUpload {
  id: string;
  file: File;
  previewUrl: string | null;
}

interface WizardContextValue {
  selectedServiceId: string | null;
  selectService: (serviceId: string) => void;
  uploadsByRequirement: Record<string, LocalUpload[]>;
  addFiles: (requirementId: string, files: readonly File[]) => void;
  removeFile: (requirementId: string, fileId: string) => void;
  reviewValues: Record<string, string>;
  setReviewValue: (fieldId: string, value: string) => void;
  usingDemo: boolean;
  continueWithDemo: () => void;
  reset: () => void;
}

const WizardContext = createContext<WizardContextValue | null>(null);

function createUploadId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function revokePreviewUrl(url: string): void {
  if (typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(url);
  }
}

export function WizardProvider({ children }: { children: ReactNode }) {
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [uploadsByRequirement, setUploadsByRequirement] = useState<
    Record<string, LocalUpload[]>
  >({});
  const [reviewValues, setReviewValues] = useState<Record<string, string>>(() => ({
    ...DEMO_INITIAL_REVIEW_VALUES,
  }));
  const [usingDemo, setUsingDemo] = useState(false);
  const previewUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const previewUrls = previewUrlsRef.current;

    return () => {
      previewUrls.forEach(revokePreviewUrl);
      previewUrls.clear();
    };
  }, []);

  const selectService = (serviceId: string) => {
    setSelectedServiceId(serviceId);
  };

  const addFiles = (requirementId: string, files: readonly File[]) => {
    const uploads = files.map<LocalUpload>((file) => {
      const canPreview =
        file.type.startsWith('image/') && typeof URL.createObjectURL === 'function';
      const previewUrl = canPreview ? URL.createObjectURL(file) : null;

      if (previewUrl) {
        previewUrlsRef.current.add(previewUrl);
      }

      return { id: createUploadId(), file, previewUrl };
    });

    setUploadsByRequirement((current) => ({
      ...current,
      [requirementId]: [...(current[requirementId] ?? []), ...uploads],
    }));
    setUsingDemo(false);
  };

  const removeFile = (requirementId: string, fileId: string) => {
    const target = uploadsByRequirement[requirementId]?.find((upload) => upload.id === fileId);

    if (target?.previewUrl) {
      revokePreviewUrl(target.previewUrl);
      previewUrlsRef.current.delete(target.previewUrl);
    }

    setUploadsByRequirement((current) => ({
      ...current,
      [requirementId]: (current[requirementId] ?? []).filter((upload) => upload.id !== fileId),
    }));
  };

  const setReviewValue = (fieldId: string, value: string) => {
    setReviewValues((current) => ({ ...current, [fieldId]: value }));
  };

  const continueWithDemo = () => {
    setUsingDemo(true);
  };

  const reset = () => {
    previewUrlsRef.current.forEach(revokePreviewUrl);
    previewUrlsRef.current.clear();
    setSelectedServiceId(null);
    setUploadsByRequirement({});
    setReviewValues({ ...DEMO_INITIAL_REVIEW_VALUES });
    setUsingDemo(false);
  };

  return (
    <WizardContext.Provider
      value={{
        selectedServiceId,
        selectService,
        uploadsByRequirement,
        addFiles,
        removeFile,
        reviewValues,
        setReviewValue,
        usingDemo,
        continueWithDemo,
        reset,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard(): WizardContextValue {
  const context = useContext(WizardContext);

  if (!context) {
    throw new Error('useWizard deve ser usado dentro de WizardProvider');
  }

  return context;
}
