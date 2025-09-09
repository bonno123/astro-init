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
	description: `
		UI developer and digital craftsman. 
		Avik Banik builds intuitive interfaces and immersive web experiences from Kolkata, India.
	`,
	image: {
		src: "/og/social.jpg",
		alt: "Build the web you want",
	},
}

export const heroWidget = {
	title: "Landing",
	description: "UI Developer & Digital Craftsman. Creating interfaces that captivate and experiences that inspire.",
	heroContent: {
		title: "Bringing digital ideas to life through code & design.",
		description: `
			I help transform concepts into reality for brands.
			Modern, performant, and visually striking web solutions.
			<br>
			<br>
			My expertise spans UI/UX, WebGL/GLSL for interactive experiences, and full-stack development.

			<br>
			<br>
			Ready to elevate your digital presence? Let's collaborate.
		`,
	},
	socialLinks: [
		{
			platform: "github",
			href: "https://github.com/bonno123",
			me: "https://github.com/bonno123",
			text: "Check out my GitHub",
			icon: "social/github",
		},
		{
			platform: "twitter",
			href: "https://twitter.com/AvikBanik1",
			me: "https://twitter.com/AvikBanik1",
			text: "Connect on Twitter",
			icon: "social/twitter",
		},
		{
			platform: "kaggle",
			href: "https://www.kaggle.com/avikbanik",
			me: "https://www.kaggle.com/avikbanik",
			text: "View my Kaggle profile",
			footerOnly: true,
			icon: "social/kaggle",
		},
		{
			platform: "codepen",
			href: "https://codepen.io/Bonno123",
			me: "https://codepen.io/Bonno123",
			text: "Explore my CodePen",
			footerOnly: true,
			icon: "social/codepen",
		},
	],
}

export const aboutMeWidget = {
	title: "About",
	description: "Frontend specialist with full-stack capabilities and a passion for creative coding.",
	aboutMe: {
		title: "I’m this ...",
		description: `
			Based in India, I help building digital experiences that blend form and function.
			<br/><br/>
			My tech arsenal includes Node.js,
			Express.js, PostgreSQL, modern front-end frameworks like React and Vue.js, and more.
			<br/>
			I take on freelance projects that challenge me to push boundaries.
			<br/><br/>
			Looking for a UI/UX focused developer for your project? Let's connect!
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
		}
	],
}

export const contactWidget = {
	title: "Contact",
	description: "Have a project in mind? Let's discuss how we can make it happen.",
	contactForm: {
		title: "Start a conversation",
		description: `
			Whether you need a complete web application, an interactive interface, or technical consultation—I'm here to help turn your vision into reality.
			<br/><br/>
			Tell me about your project, and I'll get back to you within 24 hours to discuss how we can collaborate effectively.
		`,
	},
}
