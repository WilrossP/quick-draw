@extends('layouts/normal_page')

@push('head_scripts')
    <!-- SKYCIV API -->
    <script src="https://dev.skyciv.com/assets/js/s3d-api-c4gLQ5B4xGNcLcvu.min.js"></script>
@endpush

@push('body_scripts')
    <script src="{{ cached_asset('assets/js/PROJECT/PROJECT.js') }}"></script>
@endpush

{{-- Push dynamic stylesheet into header --}}
@push('styles')
	<link href="{{ cached_asset('assets/css/PROJECT/PROJECT.css') }}" rel="stylesheet" type="text/css">
@endpush

{{-- Push Left Main Nav --}}
@push('main_nav_left')
    
@endpush

@section('content')
	<?php include(resource_path('projects/PROJECT/frontend/body.html')); ?>
@endsection