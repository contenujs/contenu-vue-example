<template>
	<div>
		<section
			class="rad-showcase rad-showcase--index rad-animation-group rad-fade-down rad-waiting rad-animate"
			style="animation-delay: 0.1s;"
		>
			<div class="container">
				<div class="row">
					<div class="col-12 col-sm-12 col-md-12 col-lg-12 col-xl-12">
						<h1 class="display-1">
							{{$contenu("header.name")}}
							<br />
							<span>{{$contenu("header.job")}}</span>
						</h1>
						<p class="lead">{{$contenu("header.description")}}</p>
						<a
							:href="$contenu('header.buttonLink')"
							class="btn btn-primary"
						>{{$contenu("header.buttonName")}}</a>
					</div>
					<img
						:src="$contenu('header.img')"
						alt
					/>
					<router-link to="/about">Go To About Page</router-link>
				</div>
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
