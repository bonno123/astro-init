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
	description:
		"Freelance Web Developer | Turning your ideas into high-performance, client-winning websites.",
	heroContent: {
		title: "Hi, I'm Avik Banik",
		description: `
			I build modern, fast, and calm-to-use websites that help businesses grow.
			<br><br>
			Custom sites • Performance tuning • Interactive experiences • Responsive by default.
			<br><br>
			Based in Kolkata, India • Available worldwide
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
	description:
		"Freelance web developer specializing in modern, performant websites that deliver results.",
	aboutMe: {
		title: "Hi, I'm Avik 👋",
		description: `
			I'm a freelance web developer based in Kolkata, India, with a passion for building websites that are both beautiful and functional.
			<br/><br/>
			<strong>What I see:</strong>
			<br/><br/>
			🎨 <strong>Design + Code:</strong> I don't just write code—I craft experiences. Every pixel matters.
			<br/><br/>
			⚡ <strong>Performance First:</strong> Fast websites rank better and convert more. I optimize for speed.
			<br/><br/>
			🎯 <strong>Results Driven:</strong> I focus on delivering measurable results.
			<br/><br/>
			<strong>Tech I use:</strong> React, Vue.js, Node.js, PostgreSQL, Astro, WebGL/GLSL for creative animations, and more.
			<br/><br/>
			<strong>Ready to work together?</strong> Let's build something amazing!
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

export const projectsWidget = {
	title: "Projects",
	description: "Selected work showcasing web development and creative coding",
	projects: [
		{
			title: "E-Commerce Platform",
			description:
				"Built a custom online store with real-time inventory management and payment integration. Increased sales by 40% in first month.",
			image: "/projects/ecommerce.jpg",
			tags: ["React", "Node.js", "PostgreSQL"],
			liveUrl: "https://example.com",
			githubUrl: "https://github.com/bonno123/project",
			featured: true,
		},
		{
			title: "Restaurant Booking System",
			description:
				"Developed a reservation system with SMS notifications and admin dashboard. Reduced booking errors by 80%.",
			image: "/projects/restaurant.jpg",
			tags: ["Vue.js", "Express", "Twilio"],
			liveUrl: "https://example.com",
			githubUrl: null,
			featured: true,
		},
		{
			title: "Interactive Portfolio",
			description:
				"Created this portfolio with WebGL animations and smooth transitions. Focus on performance and visual impact.",
			image: "/projects/portfolio.jpg",
			tags: ["Astro", "WebGL", "GLSL"],
			liveUrl: "https://avikb.dev",
			githubUrl: "https://github.com/bonno123/astro-init",
			featured: true,
		},
	],
}
