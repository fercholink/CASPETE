<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('teachers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('school_id');
            $table->string('specialty', 100)->nullable();
            $table->timestamps();

            // Referencias a tablas asumidas (users y schools)
            // En un entorno real se descomentarían si las migraciones base ya existen
            // $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            // $table->foreign('school_id')->references('id')->on('schools')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teachers');
    }
};
