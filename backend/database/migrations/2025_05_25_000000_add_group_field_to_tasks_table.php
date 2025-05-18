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
        Schema::table('tasks', function (Blueprint $table) {
            $table->string('group')->nullable()->after('status');
            $table->string('stage')->nullable()->after('group');
            $table->decimal('value', 10, 2)->nullable()->after('actual_hours');
            $table->string('phone')->nullable()->after('value');
            $table->string('country_code')->nullable()->after('phone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn(['group', 'stage', 'value', 'phone', 'country_code']);
        });
    }
};
