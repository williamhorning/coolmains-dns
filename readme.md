# coolmains

a project providing free domains (ETLD+1s)

## how do i get one of these

create a file in the zone folder you want to get a domain on and add stuff to it:

```jsonc
// dns/zones/ismakingsomething.cool./williamhorning.json
[
	{
		"label": "@",
		"type": "CNAME",
		"value": "google.com"
	},
	...
]
```

## support

join the [discord server](https://discord.gg/K2nBQa9zv4) or shoot us [an email](mailto:ismakingsomething.cool@outlook.com)

## contributors

thanks to [Nate Sales](https://github.com/natesales) for providing [Packetframe](https://packetframe.com/) access

thanks to [Keaton AG Lair](https://kagl.me/) for providing the domains used

the code in this repo is written by [William Horning](https://williamhorning.dev) and is released under the MIT license
