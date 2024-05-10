export interface AnyUI {
  id: string;
}

export type UILink = AnyUI;
export type UINavigationButton = AnyUI;
export type UIInputField = AnyUI;
export type UIMultilineLabel = AnyUI;
export type UIButton = AnyUI;

export interface UISection {
  _rows(): Promise<AnyUI[]>;
}

export interface UIForm {
  onSubmit(values: Record<any, any>): Promise<void> | undefined;
  sections(): Promise<UISection[]>;
}

declare global {
  namespace App {
    function createUILink(info: {
      id: string;
      label: string;
      value?: string;
    }): UILink;
  }
}

declare global {
  namespace App {
    function createUIMultilineLabel(info: {
      id: string;
      label: string;
      value: string;
    }): UIMultilineLabel;
  }
}

declare global {
  namespace App {
    function createUIInputField(info: {
      id: string;
      label: string;
      value: String;
    }): UIInputField;
  }
}

declare global {
  namespace App {
    function createUINavigationButton(info: {
      id: string;
      label: string;
      form: UIForm;
    }): UINavigationButton;
  }
}

declare global {
  namespace App {
    function createUIForm(info: {
      sections: () => Promise<UISection[]>;
      onSubmit?: (arg0: Record<any, any>) => Promise<void>;
    }): UIForm;
  }
}

declare global {
  namespace App {
    function createUIButton(info: {
      id: string;
      label: string;
      onTap: () => Promise<void>;
    }): UIButton;
  }
}

declare global {
  namespace App {
    function createUISection(info: {
      id: string;
      title?: string;
      isHidden: boolean;
      rows: () => Promise<AnyUI[]>;
    }): UISection;
  }
}
