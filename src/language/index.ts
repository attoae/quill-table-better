import type { Props } from '../types';
import en_US from './en_US';
import zh_CN from './zh_CN';
import fr_FR from './fr_FR';
import pl_PL from './pl_PL';
import de_DE from './de_DE';
import ru_RU from './ru_RU';
import tr_TR from './tr_TR';
import pt_PT from './pt_PT';
import ja_JP from './ja_JP';
import pt_BR from './pt_BR';
import cs_CZ from './cs_CZ';
import da_DK from './da_DK';
import nb_NO from './nb_NO';
import it_IT from './it_IT';
import sv_SE from './sv_SE';
import zh_TW from './zh_TW';

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
      tr_TR,
      pt_PT,
      ja_JP,
      pt_BR,
      cs_CZ,
      da_DK,
      nb_NO,
      it_IT,
      sv_SE,
      zh_TW,
    };
    this.init(language);
  }

  changeLanguage(name: string) {
    this.name = name;
  }

  init(language: string | LanguageConfig) {
    if (
      typeof language === 'undefined' ||
      typeof language === 'string'
    ) {
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