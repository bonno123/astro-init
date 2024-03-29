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

export const siteInfo: SiteInfo = {
	title: `%s | ${import.meta.env.PUBLIC_SITE_NAME}`,
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
		description: `I guess you are a bit early here. 🤔 I hardly can button it all!
		<br>
		By the way, your visit to *this* island 🏝️ is much appreciated.
		<br>
		<br>
		Here, I have planned to share my GLSL design *playground*.
		If you are interested, 💀 you can *subscribe* to my newsletter to get updates on what I am doing.

		<br>
		<br>
		Meanwhile, you can check out my social profiles or know *about* me.
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
			I am a software engineer veteran of 3+ years with the passion for web development.
			<br>
			<br>
			My expertise lies in building web applications front-end part. Worked mostly 
			with Vue.js and its ecosystem like Quasar.
			<br>
			I also have worked for backend a bit with Node.js and FastAPI, and databases like Oracle, postgreSQL with Prisma ORM.
			<br>
			<br>
			I am currently working as a software engineer at a startup called RentApp.
			And also a part-time freelancer and have worked with clients from the UK(Slovakia), and India.
			I am always open to new opportunities.
			<br>
			<br>
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
