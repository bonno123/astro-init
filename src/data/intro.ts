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
            link: "https://twitter.com/avikbanik1",
        },
        {
            label: "Github",
            link: "https://github.com/bonno123",
        },
        {
            label: "Linkedin",
            link: "https://www.linkedin.com/in/avik-banik-38b097140/",
        },
        {
            label: "Codepen",
            link: "https://codepen.io/Bonno123",
        },
        {
            label: "Kaggle",
            link: "https://www.kaggle.com/avikbanik",
        },
        {
            label: "Instagram",
            link: "https://www.instagram.com/_sporadikos_/",
        },
    ],
};
  
export default aboutMe;