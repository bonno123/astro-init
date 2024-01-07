type SocialLinks = {
    label: string;
    link: string;
};
  
type AboutMe = {
    mail: string;
    title: string;
    description: string;
    socials: SocialLinks[];
    profile?: string;
};
  
const aboutMe: AboutMe = {
    mail: "banikavik@gmail.com",
    title: "Hi, I’m Avik",
    // profile: "/profile.webp",
    description:
        "I'm a *frontend developer* with over *3 years* of experience. I am currently working with *Vue.js Quasar and Typescript*. Outside of work I explore things arbitrarily.",
    socials: [
        {
            label: "X",
            link: "https://twitter.com/",
        },
        {
            label: "Github",
            link: "https://github.com/",
        },
        {
            label: "Linkedin",
            link: "https://github.com/",
        },
        {
            label: "Facebook",
            link: "https://facebook.com",
        },
        {
            label: "Instagram",
            link: "https://instagram.com",
        },
    ],
};
  
export default aboutMe;