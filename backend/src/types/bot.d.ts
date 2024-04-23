import { Telegraf, Scenes, Markup, Context } from "telegraf";

interface WizardState {
  lastName?: string;
  firstName?: string;
  phoneNumber?: string;
}

export interface MyContext extends Context {
  scene: Scenes.SceneContextScene<MyContext, Scenes.WizardSessionData>;
  wizard: Scenes.WizardContextWizard<MyContext> & { state: WizardState };
}

interface SessionData extends WizardSessionData {}

declare module "telegraf/typings/context" {
  interface TelegrafContext {
    session: Scenes.WizardSession<SessionData>;
  }
}
