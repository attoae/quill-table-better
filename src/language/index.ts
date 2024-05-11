import en_US from './en_US';
import zh_CN from './zh_CN';

interface Config {
  [propName: string]: Props
}

class Language {
  config: Config;
  language: string;
  constructor(language: string = 'en_US') {
    this.config = {
      'en_US': en_US,
      'zh_CN': zh_CN
    };
    this.language = language;
  }

  changeLanguage(language: string) {
    this.language = language;
  }

  registry(language: string, content: Props) {
    this.config = {
      ...this.config,
      [language]: content
    }
  }

  useLanguage(name: string) {
    return this.config[this.language][name];
  }
}

export default Language;