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
							{{$contenu.header.name.parse()}}
							<br />
							<span>{{$contenu.header.job.parse()}}</span>
						</h1>
						<p class="lead">{{$contenu.header.description.parse()}}</p>
						<a
							:href="$contenu.header.buttonLink.parse()"
							class="btn btn-primary"
						>{{$contenu.header.buttonName.parse()}}</a>
					</div>
					<router-link to="/about">Go To About Page</router-link>
				</div>
			</div>
		</section>
	</div>
</template>

<script>
/* eslint-disable */
export default {
	name: "App"
};
</script>
