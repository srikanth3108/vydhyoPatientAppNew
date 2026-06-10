declare module 'react-native-html-to-pdf' {
  interface Options {
    html: string;
    fileName?: string;
    directory?: string;
    base64?: boolean;
    height?: number;
    width?: number;
    padding?: number;
    paddingLeft?: number;
    paddingRight?: number;
    paddingTop?: number;
    paddingBottom?: number;
    bgColor?: string;
  }

  interface PDFResult {
    filePath: string;
    base64?: string;
    numberOfPages?: number;
  }

  const RNHTMLtoPDF: {
    convert(options: Options): Promise<PDFResult>;
  };

  export default RNHTMLtoPDF;
}
