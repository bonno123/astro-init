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
    title: "Hello, I’m Avik",
    // profile: "/profile.webp",
    description: `
        I am a software engineer veteran of 3+ years.
        I have a passion for building web applications.
        I love JavaScript.
        <br>
        I have experience in building web applications using JS ecosystem like Vue, Quasar, Node.js. 
        And also with using Python and its frameworks like FastAPI.
        I have also worked with databases like Oracle, postgreSQL with Prisma ORM.
        <br>
        I am currently working as a software engineer at a startup called RentApp. 
        and also a part-time freelancer and have worked with clients from the UK(Slovakia), and India.
        I am always open to new opportunities and challenges.
        Feel free to contact me at contact@avikbanik.com
    `,
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