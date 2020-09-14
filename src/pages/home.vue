<template>
	<div>
		<section style="animation-delay: 0.1s;">
			<div class="container">
				<div class="row">
					<div class="col-4">
						<img
							:src="$contenu('header.img')"
							alt
						/>
					</div>
					<div class="col-8">
						<h1>{{$contenu("header.name")}}</h1>
						<span>{{$contenu("header.job")}}</span>
						<p>{{$contenu("header.description")}}</p>
						<a :href="$contenu('header.buttonLink')">{{$contenu("header.buttonName")}}</a>
					</div>
				</div>
				<router-link to="/about">Go To About Page</router-link>
			</div>
		</section>
	</div>
</template>

<script>
/* eslint-disable */
export default {
	name: "App",
};
</script>
