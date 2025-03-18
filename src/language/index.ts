import type { Props } from '../types';
import de_DE from './de_DE';
import en_US from './en_US';
import fr_FR from './fr_FR';
import pl_PL from './pl_PL';
import ru_RU from './ru_RU';
import tr_TR from './tr_TR';
import zh_CN from './zh_CN';

interface Config {
  [propName: string]: Props;
}

interface LanguageConfig {
  name: string;
  content: Props;
}

class Language {
  config: Config;
  language: string | LanguageConfig;
  name: string;
  constructor(language?: string | LanguageConfig) {
    this.config = {
      en_US,
      zh_CN,
      fr_FR,
      pl_PL,
      de_DE,
      ru_RU,
      tr_TR
    };
    this.init(language);
  }

  changeLanguage(name: string) {
    this.name = name;
  }

  init(language: string | LanguageConfig) {
    if (typeof language === 'undefined' || typeof language === 'string') {
      this.changeLanguage(language || 'en_US');
    } else {
      const { name, content } = language;
      content && this.registry(name, content);
      name && this.changeLanguage(name);
    }
  }

  registry(name: string, content: Props) {
    this.config = {
      ...this.config,
      [name]: content
    };
  }

  useLanguage(name: string) {
    return this.config[this.name][name];
  }
}

export default Language;
