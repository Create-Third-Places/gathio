import fs from "fs";
import toml from "toml";
import { exitWithError } from "./process.js";

interface StaticPage {
    title: string;
    path: string;
    filename: string;
}

interface GathioConfig {
    general: {
        domain: string;
        port: string;
        email: string;
        site_name: string;
        delete_after_days: number;
        is_federated: boolean;
        email_logo_url: string;
        show_kofi: boolean;
        show_public_event_list: boolean;
        mail_service: "nodemailer" | "sendgrid";
        creator_email_addresses: string[];
    };
    database: {
        mongodb_url: string;
    };
    nodemailer?: {
        smtp_server: string;
        smtp_port: string;
        smtp_username: string;
        smtp_password: string;
    };
    sendgrid?: {
        api_key: string;
    };
    static_pages?: StaticPage[];
}

interface FrontendConfig {
    domain: string;
    siteName: string;
    isFederated: boolean;
    emailLogoUrl: string;
    showKofi: boolean;
    showPublicEventList: boolean;
    showInstanceInformation: boolean;
    staticPages?: StaticPage[];
    version: string;
}

const defaultConfig: GathioConfig = {
    general: {
        domain: "localhost:3000",
        email: "contact@example.com",
        port: "3000",
        site_name: "gathio",
        is_federated: true,
        delete_after_days: 7,
        email_logo_url: "",
        show_public_event_list: false,
        show_kofi: false,
        mail_service: "nodemailer",
        creator_email_addresses: [],
    },
    database: {
        mongodb_url: "mongodb://localhost:27017/gathio",
    },
};

export const frontendConfig = (): FrontendConfig => {
    const config = getConfig();
    return {
        domain: config.general.domain,
        siteName: config.general.site_name,
        isFederated: !!config.general.is_federated,
        emailLogoUrl: config.general.email_logo_url,
        showPublicEventList: !!config.general.show_public_event_list,
        showKofi: !!config.general.show_kofi,
        showInstanceInformation: !!config.static_pages?.length,
        staticPages: config.static_pages,
        version: process.env.npm_package_version || "unknown",
    };
};

interface InstanceRule {
    icon: string;
    text: string;
}

export const instanceRules = (): InstanceRule[] => {
    const config = getConfig();
    const rules = [];
    rules.push(
        config.general.show_public_event_list
            ? {
                  text: "Public events and groups are displayed on the homepage",
                  icon: "fas fa-eye",
              }
            : {
                  text: "Events and groups can only be accessed by direct link",
                  icon: "fas fa-eye-slash",
              },
    );
    rules.push(
        config.general.creator_email_addresses?.length
            ? {
                  text: "Only specific people can create events and groups",
                  icon: "fas fa-user-check",
              }
            : {
                  text: "Anyone can create events and groups",
                  icon: "fas fa-users",
              },
    );
    rules.push(
        config.general.delete_after_days > 0
            ? {
                  text: `Events are automatically deleted ${config.general.delete_after_days} days after they end`,
                  icon: "far fa-calendar-times",
              }
            : {
                  text: "Events are permanent, and are never automatically deleted",
                  icon: "far fa-calendar-check",
              },
    );
    rules.push(
        config.general.is_federated
            ? {
                  text: "This instance federates with other instances using ActivityPub",
                  icon: "fas fa-globe",
              }
            : {
                  text: "This instance does not federate with other instances",
                  icon: "fas fa-globe",
              },
    );
    return rules;
};

// Attempt to load our global config. Will stop the app if the config file
// cannot be read (there's no point trying to continue!)
export const getConfig = (): GathioConfig => {
    try {
        const config = toml.parse(
            fs.readFileSync("./config/config.toml", "utf-8"),
        ) as GathioConfig;
        return {
            ...defaultConfig,
            ...config,
        };
    } catch {
        exitWithError(
            "Configuration file not found! Have you renamed './config/config-example.toml' to './config/config.toml'?",
        );
        return process.exit(1);
    }
};

export default getConfig;
