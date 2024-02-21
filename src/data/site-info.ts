export type SocialLink = {
	platform: string
	href: string
	me?: string
	text: string
	icon: string
	footerOnly?: boolean
}

export type SiteInfo = {
	title: string
	description: string
	image: {
		src: string
		alt: string
	}
}

export type HeroWidget = {
	title: string
	description: string
	socialLinks: SocialLink[]
}
export const siteName = "Avik Banik";

export const siteInfo: SiteInfo = {
	title: `%s | ${siteName}`,
	description: `3D web design, 
		built with Astro TypeScript, TresJS, super fast static sites; 
		loading animations, while loading the client-side JavaScript.
		examples of webgl, GLSL, and 3D web development in the browser
	`,
	image: {
		src: "/og/social.jpg",
		alt: "Build the web you want",
	},
}

export const heroWidget = {
	title: "Landing",
	description: "3D landing page with minimalistic design",
	heroContent: {
		title: "Here’s a clean piece of paper",
		description: `Wait what !? 🤔 I guess you are early here. I hardly can button it all! 
		<br>
		Anyway, thanks for giving a damn to *this* island! 🏝️
		<br>
		Here, I will be sharing my design experiments.	
		If you are interested you can *subscribe* to my newsletter to get updates on what I am doing.
  
		<br>
		As we are all human 💀, you can also share your thoughts *here* with *me*.
		`,
	},
	socialLinks: [
		{
			platform: "github",
			href: "https://github.com/bonno123/astro-init",
			me: "https://github.com/bonno123",
			text: "Go to GitHub repo",
			icon: "social/github",
		},
		{
			platform: "twitter",
			href: "https://twitter.com/AvikBanik1",
			me: "https://twitter.com/AvikBanik1",
			text: "Follow on Twitter",
			icon: "social/twitter",
		},
		{
			platform: "kaggle",
			href: "https://www.kaggle.com/avikbanik",
			me: "https://www.kaggle.com/avikbanik",
			text: "Follow on kaggle",
			footerOnly: true,
			icon: "social/kaggle",
		},
        {
			platform: "codepen",
			href: "https://codepen.io/Bonno123",
			me: "https://codepen.io/Bonno123",
			text: "Follow on kaggle",
			footerOnly: true,
			icon: "social/codepen",
		},
	],
}

export const aboutMeWidget = {
	title: "About Me",
	description: "portfolio of software engineer, web developer.",
	aboutMe: {
		title: "Hello, I’m Avik",
		description: `
			I am a software engineer veteran of 3+ years.
			I have a passion for building web applications.
			I love JavaScript.
			<br>
			I have experience in building web applications using JS ecosystem like Vue, Quasar, Node.js. 
			And also with using Python and its frameworks like FastAPI.
			I have also worked with databases like Oracle, postgreSQL with Prisma ORM.
			<br>
			<br>
			I am currently working as a software engineer at a startup called RentApp. 
			and also a part-time freelancer and have worked with clients from the UK(Slovakia), and India.
			I am always open to new opportunities and challenges.
			Feel free to contact me at <strong class="fw-bold">${import.meta.env.PUBLIC_CONTACT_EMAIL}</strong>
			or reach out to me on any of the following options!
    	`,
		mail: import.meta.env.PUBLIC_CONTACT_EMAIL,
	},
	socialLinks: [
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
}
