<template>
	<div id="app">
		<img
			alt="Vue logo"
			src="./assets/logo.png"
		/>
		<p>{{ $contenu.header.heading.parse() }}</p>
		<p>{{ $contenu.header.Description.parse() }}</p>
		<p>{{ $contenu.header.Description.x.u.parse() }}</p>
		<p>{{ $contenu.soemfield.x.parse() }}</p>
		<!-- <p>{{ $contenu.header.ehem.ohum }}</p> -->
	</div>
</template>

<script>
/* eslint-disable */
export default {
	name: "App"
};
</script>
